import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { ChatRoom } from "@/types/friend"
import type { User } from "@supabase/supabase-js"

export function useChatRooms(user: User | null) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  const fetchChatRooms = async () => {
    if (!user) return

    // 1. 내가 멤버로 속한 방 ID들 + custom_name 가져오기
    const { data: memberData } = await supabase
      .from('room_members')
      .select('room_id, custom_name')
      .eq('user_id', user.id)

    if (!memberData || memberData.length === 0) {
      setChatRooms([])
      return
    }

    const roomIds = memberData.map(r => r.room_id)
    const customNames = new Map(memberData.map(r => [r.room_id, r.custom_name]))

    // 2. 방 정보 가져오기
    const { data: rooms, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .in('id', roomIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching rooms:', error)
      return
    }

    // 3. custom_name 병합
    const roomsWithCustomName = (rooms || []).map(room => ({
      ...room,
      custom_name: customNames.get(room.id) || null
    }))

    setChatRooms(roomsWithCustomName)
  }

  const handleUpdateRoomName = async (roomId: string) => {
    if (!user || !editingName.trim()) {
      setEditingRoomId(null)
      return
    }

    try {
      const { error } = await supabase
        .from('room_members')
        .update({ custom_name: editingName.trim() })
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .select()

      if (error) throw error

      toast.success("채팅방 이름이 변경되었습니다!")
      setEditingRoomId(null)
      setEditingName("")
      fetchChatRooms()
    } catch (err: any) {
      console.error('❌ Update error:', err)
      toast.error("이름 변경 실패: " + err.message)
    }
  }

  useEffect(() => {
    if (!user) return

    fetchChatRooms()

    const roomChannel = supabase
      .channel('room_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `user_id=eq.${user.id}` }, () => fetchChatRooms())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, () => fetchChatRooms())
      .subscribe()

    return () => {
      supabase.removeChannel(roomChannel)
    }
  }, [user])

  return {
    chatRooms,
    editingRoomId,
    setEditingRoomId,
    editingName,
    setEditingName,
    handleUpdateRoomName,
    fetchChatRooms
  }
}
