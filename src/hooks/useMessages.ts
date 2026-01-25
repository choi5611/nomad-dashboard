import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useStore } from "@/store/useStore"
import { useQueryClient } from "@tanstack/react-query"
import { useInfiniteMessages } from "./useInfiniteMessages"
import type { DMMessage, ChatInfo } from "@/types/message"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/profile"

export function useMessages(
  chat: ChatInfo,
  user: User | null,
  profile: Profile | null,
  scrollToBottom: () => void
) {
  const queryClient = useQueryClient()
  const queryKey = ["messages", chat.type, chat.id]

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteMessages(chat, user?.id)

  // 1. 모든 페이지의 메시지를 하나의 배열로 펼침 (최신 페이지가 0번 인덱스이므로 역순 처리 개념 주의)
  const rawMessages = data?.pages.flatMap(page => page.messages) || []

  // 2. 중복 제거 (Map 사용, ID 기준)
  const uniqueMessagesMap = new Map()
  rawMessages.forEach((msg) => {
    uniqueMessagesMap.set(msg.id, msg)
  })

  // 3. 시간순 정렬 (오래된 것 -> 최신 것)
  const messages = Array.from(uniqueMessagesMap.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // 캐시 업데이트 헬퍼 함수
  const updateMessageCache = (newMessage: DMMessage) => {
    queryClient.setQueryData(queryKey, (oldData: any) => {
      // 기존 데이터가 아예 없으면 (첫 메시지인 경우 등) 새 페이지 구조 생성
      if (!oldData || !oldData.pages || oldData.pages.length === 0) {
        return {
          pages: [{ messages: [newMessage], totalCount: 1 }],
          pageParams: [0]
        }
      }
      
      // 이미 존재하는 메시지인지 확인 (중복 방지 - ID 기준)
      const messageExists = oldData.pages.some((page: any) => 
        page.messages.some((m: any) => m.id === newMessage.id)
      )
      if (messageExists) return oldData

      // 기존 데이터 보존하면서 최신 페이지(첫 번째 페이지)의 맨 앞에 새 메시지 추가
      // (React Query의 infinite query 데이터 구조 유지)
      const newPages = [...oldData.pages]
      newPages[0] = {
        ...newPages[0],
        messages: [newMessage, ...newPages[0].messages],
        totalCount: (newPages[0].totalCount || 0) + 1
      }
      
      return { ...oldData, pages: newPages }
    })
    
    // 메시지 수신 시 스크롤 이동
    setTimeout(scrollToBottom, 50)
  }

  // 실시간 구독 (모든 메시지의 유일한 진실의 원천)
  useEffect(() => {
    if (!user) return

    // 입장 시 unread 리셋
    const { resetUnread } = useStore.getState()
    resetUnread(chat.type === 'dm' ? 'dm' : 'room', chat.id)

    const tableName = chat.type === 'group' ? 'group_messages' : 'direct_messages'
    const filterConfig = chat.type === 'dm'
      ? `receiver_id=eq.${user.id}`
      : `room_id=eq.${chat.id}`

    const channel = supabase
      .channel(`chat:${chat.id}:${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: tableName,
        filter: filterConfig
      }, async (payload) => {
        const newMessage = payload.new as any
        const senderId = newMessage.sender_id || newMessage.user_id

        // sender 정보 가져오기
        if (!newMessage.sender) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, avatar_url, country_code')
            .eq('id', senderId)
            .single()
          if (profileData) newMessage.sender = profileData
        }

        // 1. 캐시 업데이트 (내가 보낸 거든 남이 보낸 거든 똑같이 처리)
        updateMessageCache(newMessage)
        
        // 2. 남이 보낸 메시지면 알림 리셋
        if (senderId !== user.id) {
          useStore.getState().resetUnread(chat.type === 'dm' ? 'dm' : 'room', chat.id)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, chat.id, chat.type])

  // 메시지 전송 (낙관적 업데이트 제거 -> 서버 응답 대기)
  const handleSendMessage = async (content: string, anonNickname: string) => {
    if (!user || !content.trim()) return

    const isAnon = chat.type === 'open'

    try {
      if (chat.type === 'group') {
        const { error } = await supabase.from('group_messages').insert({
          room_id: chat.id,
          user_id: user.id,
          content
        })
        if (error) throw error
      } else {
        const insertData: any = {
          sender_id: user.id,
          content,
          is_anonymous: isAnon,
          nickname: isAnon ? anonNickname : null
        }

        if (chat.type === 'dm') {
          insertData.receiver_id = chat.id
        } else {
          insertData.room_id = chat.id
        }

        const { error } = await supabase.from('direct_messages').insert(insertData)
        if (error) throw error
      }
    } catch (err: any) {
      console.error('❌ Message Send Failed:', err)
      toast.error(`전송 실패: ${err.message}`)
    }
  }

  const handleLeaveChat = async (onBack: () => void) => {
    if (!chat.id || !user) return

    try {
      // 1. 멤버십 정보 조회
      const { data: memberData, error: fetchError } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', chat.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (!memberData) {
        toast.error("멤버 정보를 찾을 수 없습니다.")
        onBack()
        return
      }

      // 시스템 메시지 (오픈채팅은 익명이라 선택 사항이지만, 그룹은 필수)
      if (chat.type === 'group') {
        try {
          await supabase.from('group_messages').insert({
            room_id: chat.id,
            user_id: user.id,
            content: `[SYSTEM] ${profile?.username || 'Unknown'}님이 나갔습니다.`
          })
        } catch (msgErr) {
          console.error('Failed to send leave message', msgErr)
        }
      }

      // 2. 멤버십 삭제 (완전 나가기)
      const { error: deleteError } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', chat.id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      toast.success(chat.type === 'open' ? "라운지에서 퇴장했습니다." : "그룹에서 퇴장했습니다.")
      
      // 3. 전역 상태 갱신 및 뒤로 가기
      const { fetchJoinedRooms } = useStore.getState()
      fetchJoinedRooms(user.id)
      onBack()
    } catch (err: any) {
      console.error('❌ Leave Chat Error:', err)
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
