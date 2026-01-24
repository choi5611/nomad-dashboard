import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useStore } from "@/store/useStore"
import { toast } from "sonner"
import type { Friend } from "@/types/friend"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/profile"

export function useFriends(user: User | null, profile: Profile | null) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)

  const fetchFriends = async (isInitial = false) => {
    if (!user) return
    if (isInitial) setLoading(true)
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          user_id,
          friend_id,
          requester:profiles!user_id(id, username, avatar_url),
          recipient:profiles!friend_id(id, username, avatar_url)
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

      if (error) throw error

      const formattedFriends: Friend[] = data.map((f: any) => {
        const isRequester = f.user_id === user.id
        const buddy = isRequester ? f.recipient : f.requester
        return {
          id: buddy.id,
          friendship_id: f.id,
          username: buddy.username || "Unknown",
          avatar_url: buddy.avatar_url,
          status: f.status,
          isRequester
        }
      })

      setFriends(formattedFriends)
    } catch (err) {
      console.error(err)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  const handleAction = async (friendshipId: string, action: 'accepted' | 'rejected') => {
    if (processingId) return
    setProcessingId(friendshipId)

    try {
      if (action === 'rejected') {
        const { error } = await supabase
          .from('friendships')
          .delete()
          .eq('id', friendshipId)
        if (error) throw error
        toast.success("요청을 거절했습니다.")
      } else {
        const { error } = await supabase
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('id', friendshipId)
        if (error) throw error
        toast.success("친구 요청을 수락했습니다!")
      }

      await fetchFriends(false)
    } catch (err: any) {
      toast.error("처리 실패: " + err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteFriend = async (friendshipId: string, friendName: string) => {
    if (processingId) return

    setProcessingId(friendshipId)

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)

      if (error) throw error

      toast.success(`${friendName}님과의 친구 관계가 해제되었습니다.`)
      await fetchFriends(false)
    } catch (err: any) {
      toast.error("삭제 실패: " + err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const toggleSelection = (friendId: string) => {
    setSelectedIds(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  const handleCreateGroup = async (fetchChatRooms: () => Promise<void>) => {
    if (selectedIds.length === 0 || !user || !profile) return
    setIsCreating(true)
    try {
      const roomName = `${profile.username}님의 그룹`
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({ name: roomName, created_by: user.id })
        .select()
        .single()

      if (roomError) throw roomError

      const members = [user.id, ...selectedIds].map(id => ({
        room_id: room.id,
        user_id: id
      }))

      const { error: memberError } = await supabase
        .from('room_members')
        .insert(members)

      if (memberError) throw memberError

      toast.success("그룹 채팅방이 생성되었습니다!")

      useStore.getState().setActiveChat({
        type: 'group',
        id: room.id,
        name: roomName
      })

      setIsSelectionMode(false)
      setSelectedIds([])
      await fetchChatRooms()
    } catch (err: any) {
      toast.error("방 생성 실패: " + err.message)
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetchFriends(true)

    const friendsChannel = supabase
      .channel('friendships_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships'
      }, () => {
        fetchFriends(false)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(friendsChannel)
    }
  }, [user])

  const pendingRequests = friends.filter(f => f.status === 'pending' && !f.isRequester)
  const acceptedFriends = friends.filter(f => f.status === 'accepted')
  const sentRequests = friends.filter(f => f.status === 'pending' && f.isRequester)

  return {
    friends,
    loading,
    processingId,
    isSelectionMode,
    setIsSelectionMode,
    selectedIds,
    isCreating,
    pendingRequests,
    acceptedFriends,
    sentRequests,
    handleAction,
    handleDeleteFriend,
    toggleSelection,
    handleCreateGroup
  }
}
