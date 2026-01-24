import { useState, useEffect } from "react"
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
  const [realtimeMessages, setRealtimeMessages] = useState<DMMessage[]>([])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteMessages(chat, user?.id)

  // 모든 메시지를 합치기 (페이지 순서 역순 + 각 페이지 내 메시지 역순 = 오래된→최신)
  const loadedMessages = [...(data?.pages || [])].reverse()
    .flatMap(page => [...page.messages].reverse())
  const messages = [...loadedMessages, ...realtimeMessages]

  useEffect(() => {
    if (!user) return

    // 페이지 변경 시 실시간 메시지 초기화
    setRealtimeMessages([])

    // 입장 시 unread 리셋
    const { resetUnread } = useStore.getState()
    resetUnread(chat.type === 'dm' ? 'dm' : 'room', chat.id)

    // 실시간 구독
    const tableName = chat.type === 'group' ? 'group_messages' : 'direct_messages'
    const filterConfig = chat.type === 'dm'
      ? `receiver_id=eq.${user.id}`
      : `room_id=eq.${chat.id}`

    const channel = supabase
      .channel(`chat:${chat.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: tableName,
        filter: filterConfig
      }, async (payload) => {
        const newMessage = payload.new as any

        // sender 정보 가져오기 (DM, Group 모두)
        if (chat.type === 'group' && !newMessage.sender) {
          const { data } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', newMessage.sender_id || newMessage.user_id)
            .single()
          if (data) newMessage.sender = data
        } else if (chat.type === 'dm' && !newMessage.sender) {
          // DM의 경우에도 sender 정보 가져오기
          const { data } = await supabase
            .from('profiles')
            .select('username, avatar_url, country_code')
            .eq('id', newMessage.sender_id)
            .single()
          if (data) newMessage.sender = data
        }

        // DM의 경우 추가 필터링
        if (chat.type === 'dm' && newMessage.sender_id !== chat.id) return

        // 본인이 보낸 메시지는 낙관적 업데이트 처리
        const senderId = newMessage.sender_id || newMessage.user_id
        if (senderId === user.id) {
          setRealtimeMessages(prev => {
            const tempMsgIndex = prev.findIndex(m =>
              m.sender_id === user.id &&
              m.content === newMessage.content &&
              Math.abs(new Date(m.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000
            )
            if (tempMsgIndex !== -1) {
              const updated = [...prev]
              updated[tempMsgIndex] = { ...updated[tempMsgIndex], ...newMessage }
              return updated
            }
            return prev
          })
          return
        }

        // 다른 사람 메시지 추가
        useStore.getState().resetUnread(chat.type === 'dm' ? 'dm' : 'room', chat.id)
        setRealtimeMessages(prev => {
          if (prev.some(m => m.id === newMessage.id)) return prev
          return [...prev, newMessage]
        })
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

    // 낙관적 업데이트
    const optimisticMsg: DMMessage = {
      id: tempId,
      sender_id: user.id,
      content,
      is_anonymous: isAnon,
      nickname: isAnon ? anonNickname : undefined,
      created_at: new Date().toISOString(),
      ...(chat.type === 'dm' ? { receiver_id: chat.id } : { room_id: chat.id })
    }

    setRealtimeMessages(prev => [...prev, optimisticMsg])

    // 메시지 전송 직후 스크롤 강제 이동
    setTimeout(scrollToBottom, 10)

    try {
      if (chat.type === 'group') {
        const { error } = await supabase.from('group_messages').insert({
          room_id: chat.id,
          user_id: user.id,
          content
        })
        if (error) throw error
      } else {
        // DM 및 오픈 채팅
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
      setRealtimeMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error(`전송 실패: ${err.message}`)
    }
  }

  const handleLeaveChat = async (onBack: () => void) => {
    if (!chat.type || chat.type !== 'group' || !user) return

    try {
      // 1. 멤버십 조회
      const { data: memberData, error: fetchError } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', chat.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (!memberData) {
        toast.error("멤버 정보를 찾을 수 없습니다. (이미 나갔거나 접근 권한 없음)")
        onBack()
        return
      }

      // 시스템 메시지 전송
      try {
        await supabase.from('group_messages').insert({
          room_id: chat.id,
          user_id: user.id,
          content: `[SYSTEM] ${profile?.username || 'Unknown'}님이 나갔습니다.`
        })
      } catch (msgErr) {
        console.error('Failed to send leave message', msgErr)
      }

      // 2. 멤버십 삭제
      let deleteQuery = supabase.from('room_members').delete({ count: 'exact' })

      if (memberData.id) {
        deleteQuery = deleteQuery.eq('id', memberData.id)
      } else {
        deleteQuery = deleteQuery.eq('room_id', chat.id).eq('user_id', user.id)
      }

      const { error: deleteError, count } = await deleteQuery

      if (deleteError) throw deleteError

      if (count === 0) {
        toast.error("삭제 실패: 권한(RLS) 부족 가능성이 있습니다.")
        return
      }

      toast.success("채팅방을 나갔습니다.")
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
