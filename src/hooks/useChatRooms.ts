import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useStore } from "@/store/useStore"
import type { User } from "@supabase/supabase-js"

// 방 목록 자체는 전역 스토어(joinedRooms, useRealtimeSync가 구독·갱신)를 쓰고 여기선 이름 변경만 다룬다
export function useChatRooms(user: User | null) {
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

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
      useStore.getState().fetchJoinedRooms(user.id)
    } catch (err: any) {
      console.error('❌ Update error:', err)
      toast.error("이름 변경 실패: " + err.message)
    }
  }

  return {
    editingRoomId,
    setEditingRoomId,
    editingName,
    setEditingName,
    handleUpdateRoomName
  }
}
