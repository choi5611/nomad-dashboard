import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useStore } from "@/store/useStore"

export function useRealtimeSync(user: any) {
  // 1. Joined Rooms Sync (Member of which rooms?)
  useEffect(() => {
    if (!user) {
      useStore.setState({ joinedRooms: [] })
      return
    }
    
    const { fetchJoinedRooms } = useStore.getState()
    fetchJoinedRooms(user.id)

    // 멤버십 또는 방 정보 변경 시 동기화
    const channel = supabase.channel('joined-rooms-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `user_id=eq.${user.id}` }, () => fetchJoinedRooms(user.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, () => fetchJoinedRooms(user.id))
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // 2. Notifications (Unread Badges)
  useEffect(() => {
    if (!user) return
    const { incrementUnread } = useStore.getState()
    const currentUserId = user.id

    // City Chat Notifications
    const cityChannel = supabase.channel('global-chat-tracker')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const { isChatOpen, selectedCity, activeTab } = useStore.getState()
        if (payload.new.author_id !== currentUserId) {
           const isVisible = isChatOpen && activeTab === 'city' && selectedCity?.name.toLowerCase() === payload.new.city_id
           if (!isVisible) incrementUnread('city')
        }
      })
      .subscribe()

    // DM Notifications
    const dmChannel = supabase.channel('global-dm-tracker')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, async (payload) => {
        const { isChatOpen, activeChat, activeTab, joinedRooms } = useStore.getState()
        if (payload.new.sender_id !== currentUserId) {
          if (payload.new.receiver_id === currentUserId) {
            const isVisible = isChatOpen && activeTab === 'friends' && activeChat?.type === 'dm' && activeChat?.id === payload.new.sender_id
            if (!isVisible) incrementUnread('dm', payload.new.sender_id)
          } else if (payload.new.room_id) {
            // 내가 실제로 가입한 방인지 엄격하게 체크
            const room = joinedRooms.find(r => r.id === payload.new.room_id)
            if (!room) return

            const targetTab = room.is_open ? 'open' : 'friends'
            const isVisible = isChatOpen && activeTab === targetTab && activeChat?.id === payload.new.room_id
            if (!isVisible) incrementUnread('room', payload.new.room_id)
          }
        }
      })
      .subscribe()

    // Group Chat Notifications (Legacy/Separate table if used)
    const groupChannel = supabase.channel('global-group-tracker')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, (payload) => {
        const { isChatOpen, activeChat, activeTab, joinedRooms } = useStore.getState()
        if (payload.new.user_id !== currentUserId) {
             const room = joinedRooms.find(r => r.id === payload.new.room_id)
             if (!room) return

             const isVisible = isChatOpen && activeTab === 'friends' && activeChat?.id === payload.new.room_id
             if (!isVisible) incrementUnread('room', payload.new.room_id)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(cityChannel)
      supabase.removeChannel(dmChannel)
      supabase.removeChannel(groupChannel)
    }
  }, [user])
}
