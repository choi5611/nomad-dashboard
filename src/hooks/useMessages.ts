import { useState, useEffect, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useStore } from "@/store/useStore"
import { useInfiniteMessages } from "./useInfiniteMessages"
import type { ChatInfo, DMMessage } from "@/types/message"
import type { User } from "@supabase/supabase-js"

export function useMessages(
  chat: ChatInfo,
  user: User | null,
  // profile 매개변수 제거 (안 씀)
  scrollToBottom: () => void
) {
  const queryClient = useQueryClient()
  // 실시간으로 들어오는 메시지를 담는 버퍼 (캐시와 별개로 관리)
  const [realtimeBuffer, setRealtimeBuffer] = useState<DMMessage[]>([])
  
  // 1. 기존 메시지 데이터 로드
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    membershipData
  } = useInfiniteMessages(chat, user?.id) as any

  // 2. [핵심] 히스토리와 실시간 메시지를 하나로 합치고 정렬
  const messages = useMemo(() => {
    // React Query에서 가져온 과거 데이터
    const history = data?.pages.flatMap((page: any) => page.messages) || []
    
    // 과거 데이터 + 실시간 버퍼 합치기
    const combined = [...history, ...realtimeBuffer]
    
    // 중복 제거 (DB에서 새로 불러온 데이터와 버퍼의 데이터가 겹칠 수 있음)
    const uniqueMap = new Map()
    combined.forEach(m => uniqueMap.set(m.id, m))
    
    // 전체를 시간순으로 정렬 (오래된 것 -> 최신 것)
    return Array.from(uniqueMap.values()).sort(
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [data, realtimeBuffer])

  // 3. 실시간 구독
  useEffect(() => {
    if (!user || !membershipData) return

    const tableName = 'direct_messages' // 모든 채팅(DM, Group, Open)을 direct_messages 테이블로 통합
    // 필터 제거: RLS 정책과 충돌 방지를 위해 모든 이벤트를 수신하고 내부에서 거름
    const filterConfig = undefined 


    const channel = supabase
      .channel(`chat:${chat.id}:${Date.now()}`) // 매번 새로운 고유 채널 생성
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: tableName,
        filter: filterConfig
      }, async (payload) => {
        const newMessage = payload.new as DMMessage
        const senderId = newMessage.sender_id || newMessage.user_id

        // 1. 방 ID 체크 (다른 방 메시지 무시)
        if (newMessage.room_id && newMessage.room_id !== chat.id) return

        // 2. DM 보안 필터링
        if (chat.type === 'dm') {
          const isMyDM = (newMessage.sender_id === user.id && newMessage.receiver_id === chat.id) ||
                         (newMessage.sender_id === chat.id && newMessage.receiver_id === user.id);
          if (!isMyDM) return;
        }


        if (!newMessage.sender) {
          const { data: p } = await supabase.from('profiles').select('username, avatar_url, country_code').eq('id', senderId!).single()
          if (p) newMessage.sender = p
        }

        // 실시간 버퍼 업데이트
        setRealtimeBuffer(prev => {
            if (prev.some(msg => msg.id === newMessage.id)) return prev
            return [...prev, newMessage]
        })
        
        if (senderId !== user.id) {
          useStore.getState().resetUnread(chat.type === 'dm' ? 'dm' : 'room', chat.id)
        }
        
        // 캐시도 같이 갱신하여 데이터 정합성 유지
        queryClient.invalidateQueries({ queryKey: ["messages", chat.type, chat.id] })
        
        // 스크롤 이동
        setTimeout(() => {
            if (typeof scrollToBottom === 'function') {
                scrollToBottom()
            }
        }, 100)
      })
      .subscribe(() => {
          // 객체 자체를 찍으면 브라우저 콘솔에서 [object Object]로 보일 수 있으므로 문자열로 찍기
      })
    
    return () => { 
        supabase.removeChannel(channel);
    }
  }, [user, chat.id, chat.type, membershipData?.joinedAt]) // 가입 정보가 바뀌면(방장 권한 획득 등) 재구독 하는 것이 안전함

  // 방을 바꿀 때마다 실시간 버퍼 초기화
  useEffect(() => {
    setRealtimeBuffer([])
  }, [chat.id])

  // 메시지 전송 로직
  const handleSendMessage = async (content: string, anonNickname: string) => {
    if (!user || !content.trim()) return

    try {
      const insertData: any = {
        sender_id: user.id,
        content,
        is_anonymous: chat.type === 'open',
        nickname: chat.type === 'open' ? anonNickname : null
      }
      
      if (chat.type === 'dm') {
        insertData.receiver_id = chat.id
      } else {
        insertData.room_id = chat.id
      }
      
      const { error } = await supabase.from('direct_messages').insert(insertData)
      if (error) throw error
      
      
      // [핵심] 전송 직후 캐시 강제 무효화 -> 내가 보낸 메시지 즉시 로드
      await queryClient.invalidateQueries({ queryKey: ["messages", chat.type, chat.id] })
      
    } catch (err: any) {
      console.error(`[Chat-Flow] Send Failed:`, err);
      toast.error(`전송 실패: ${err.message}`)
    }
  }

  const handleLeaveChat = async (onBack: () => void) => {
    if (!chat.id || !user) return

    try {
      const { error: deleteError } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', chat.id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      toast.success(chat.type === 'open' ? "라운지에서 퇴장했습니다." : "그룹에서 퇴장했습니다.")
      useStore.getState().fetchJoinedRooms(user.id)
      onBack()
    } catch (err: any) {
      toast.error("오류 발생: " + err.message)
    }
  }

  return {
    messages,
    loading: isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    handleSendMessage,
    handleLeaveChat
  }
}
