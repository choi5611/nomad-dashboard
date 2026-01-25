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

  // 모든 메시지를 합치기 (오래된→최신 순 정렬)
  const messages = [...(data?.pages || [])].reverse()
    .flatMap(page => [...page.messages].reverse())

  // 캐시 업데이트 헬퍼 함수
  const updateMessageCache = (newMessage: DMMessage) => {
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData
      
      // 이미 존재하는 메시지인지 확인 (중복 방지)
      const messageExists = oldData.pages.some((page: any) => 
        page.messages.some((m: any) => m.id === newMessage.id)
      )
      if (messageExists) return oldData

      // 최신 페이지(첫 번째 페이지)의 맨 앞에 새 메시지 추가
      const newPages = [...oldData.pages]
      if (newPages.length > 0) {
        newPages[0] = {
          ...newPages[0],
          messages: [newMessage, ...newPages[0].messages]
        }
      }
      
      return { ...oldData, pages: newPages }
    })
    
    // 메시지 수신 시 스크롤 이동
    setTimeout(scrollToBottom, 50)
  }

  useEffect(() => {
    if (!user) return

    // 입장 시 unread 리셋
    const { resetUnread } = useStore.getState()
    resetUnread(chat.type === 'dm' ? 'dm' : 'room', chat.id)

    // 실시간 구독
    const tableName = chat.type === 'group' ? 'group_messages' : 'direct_messages'
    const filterConfig = chat.type === 'dm'
      ? `receiver_id=eq.${user.id}`
      : `room_id=eq.${chat.id}`

    const channel = supabase
      .channel(`chat:${chat.id}:${Date.now()}`) // 채널 ID 고유화
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: tableName,
        filter: filterConfig
      }, async (payload) => {
        const newMessage = payload.new as any
        const senderId = newMessage.sender_id || newMessage.user_id

        // 본인이 보낸 메시지는 handleSendMessage에서 직접 처리하므로 무시
        if (senderId === user.id) return

        // sender 정보 가져오기
        if (!newMessage.sender) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, avatar_url, country_code')
            .eq('id', senderId)
            .single()
          if (profileData) newMessage.sender = profileData
        }

        // DM의 경우 필터링
        if (chat.type === 'dm' && newMessage.sender_id !== chat.id) return

        // 캐시 업데이트 및 알림 리셋
        updateMessageCache(newMessage)
        useStore.getState().resetUnread(chat.type === 'dm' ? 'dm' : 'room', chat.id)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, chat.id, chat.type])

  const handleSendMessage = async (content: string, anonNickname: string) => {
    if (!user || !content.trim()) return

    const tempId = Math.random().toString(36).substring(7)
    const isAnon = chat.type === 'open'

    // 낙관적 업데이트를 위해 캐시에 즉시 추가
    const optimisticMsg: DMMessage = {
      id: tempId,
      sender_id: user.id,
      content,
      is_anonymous: isAnon,
      nickname: isAnon ? anonNickname : undefined,
      created_at: new Date().toISOString(),
      sender: {
        username: profile?.username || "Me",
        avatar_url: profile?.avatar_url || null,
        country_code: profile?.country_code
      },
      ...(chat.type === 'dm' ? { receiver_id: chat.id } : { room_id: chat.id })
    }

    updateMessageCache(optimisticMsg)

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
      // 실패 시 캐시에서 해당 임시 메시지 제거 (정교한 처리를 위해선 추가 로직 필요하지만 우선 에러 알림)
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
