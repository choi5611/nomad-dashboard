import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/store/useAuth"
import { useStore } from "@/store/useStore"
import { UserCheck, UserX, MessageSquare, Loader2, UserPlus, Heart, Users, UserMinus, Pencil, Check, X } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

interface Friend {
  id: string
  friendship_id: string
  username: string
  avatar_url: string | null
  status: 'pending' | 'accepted'
  isRequester: boolean
}

interface ChatRoom {
  id: string
  name: string
  created_by: string
  member_count?: number
  custom_name?: string | null
}

export default function FriendsList() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
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

  useEffect(() => {
    if (!user) {
      // 비회원일 때는 로딩 종료
      setLoading(false)
      return
    }

    fetchFriends(true)
    fetchChatRooms()

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

    const roomChannel = supabase
      .channel('room_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `user_id=eq.${user.id}` }, () => fetchChatRooms())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, () => fetchChatRooms())
      .subscribe()

    return () => {
      supabase.removeChannel(friendsChannel)
      supabase.removeChannel(roomChannel)
    }
  }, [user])

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

  const toggleSelection = (friendId: string) => {
    setSelectedIds(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId) 
        : [...prev, friendId]
    )
  }

  const handleDeleteFriend = async (friendshipId: string, friendName: string) => {
    if (processingId) return
    
    // 확인 없이 조용히 삭제
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

  const handleCreateGroup = async () => {
    if (selectedIds.length === 0 || !user) return
    setIsCreating(true)
    try {
      const roomName = `${user.email?.split('@')[0]}님의 그룹`
      console.log('🔍 Creating room with user.id:', user.id)
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({ name: roomName, created_by: user.id })
        .select()
        .single()
      console.log('📦 Room creation result:', { room, error: roomError })

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
    } catch (err: any) {
      toast.error("방 생성 실패: " + err.message)
    } finally {
      setIsCreating(false)
      fetchChatRooms() // 방 목록 갱신
    }
  }

  const handleUpdateRoomName = async (roomId: string) => {

    if (!user || !editingName.trim()) {
      setEditingRoomId(null)
      return
    }

    try {
     

      const { data, error } = await supabase
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

  const pendingRequests = friends.filter(f => f.status === 'pending' && !f.isRequester)
  const acceptedFriends = friends.filter(f => f.status === 'accepted')
  const sentRequests = friends.filter(f => f.status === 'pending' && f.isRequester)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    )
  }

  // 비회원일 때 안내 메시지
  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <Users className="w-12 h-12 text-white/20" />
        <div>
          <h3 className="text-sm font-semibold text-white mb-2">로그인이 필요합니다</h3>
          <p className="text-xs text-white/40">친구 기능을 사용하려면 로그인해주세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-6 pr-2 no-scrollbar">
      {/* Header with Group Creation */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
            <Heart className="w-3 h-3" /> My Nomads ({acceptedFriends.length})
        </h3>
        {acceptedFriends.length > 0 && (
          <button 
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${
              isSelectionMode 
              ? "bg-indigo-500 text-white border-indigo-400" 
              : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
            }`}
          >
            {isSelectionMode ? "취소" : "그룹 생성"}
          </button>
        )}
      </div>

      {isSelectionMode && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between"
        >
          <p className="text-[10px] text-indigo-300 font-bold uppercase">
            {selectedIds.length}명 선택됨
          </p>
          <button
            onClick={handleCreateGroup}
            disabled={selectedIds.length === 0 || isCreating}
            className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-bold rounded-lg disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isCreating && <Loader2 className="w-3 h-3 animate-spin" />}
            채팅 시작
          </button>
        </motion.div>
      )}

      {/* Group Chats */}
      {chatRooms.length > 0 && !isSelectionMode && (
        <section>
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
             <MessageSquare className="w-3 h-3" /> Group Chats
          </h3>
          <div className="space-y-2">
            {chatRooms.map(room => (
              <div
                key={room.id}
                onClick={() => {
                  if (editingRoomId !== room.id) {
                    useStore.getState().setActiveChat({
                      type: 'group',
                      id: room.id,
                      name: room.custom_name || room.name
                    })
                    useStore.getState().resetUnread('room', room.id)
                  }
                }}
                className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingRoomId === room.id ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleUpdateRoomName(room.id)
                            if (e.key === 'Escape') setEditingRoomId(null)
                          }}
                          className="bg-white/10 border border-purple-500/50 rounded-lg px-2 py-1 text-sm text-white w-32 focus:outline-none focus:border-purple-400"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateRoomName(room.id)}
                          className="p-1 hover:bg-green-500/20 rounded text-green-400"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingRoomId(null)}
                          className="p-1 hover:bg-red-500/20 rounded text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors uppercase tracking-tighter truncate">
                          {room.custom_name || room.name}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingRoomId(room.id)
                            setEditingName(room.custom_name || room.name)
                          }}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded text-white/40 hover:text-white transition-all"
                          title="이름 변경"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-white/30 uppercase font-mono">
                      Group Chat
                    </p>
                  </div>
                </div>
                {useStore.getState().unreadState.rooms[room.id] > 0 && (
                   <span className="w-5 h-5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full border border-slate-900 shadow-lg font-bold">
                      {useStore.getState().unreadState.rooms[room.id]}
                   </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <section>
          <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
             <UserPlus className="w-3 h-3" /> New Requests
          </h3>
          <div className="space-y-2">
            {pendingRequests.map(req => (
              <FriendItem 
                key={req.id} 
                friend={req} 
                isProcessing={processingId === req.friendship_id}
                onAccept={() => handleAction(req.friendship_id, 'accepted')}
                onReject={() => handleAction(req.friendship_id, 'rejected')}
              />
            ))}
          </div>
        </section>
      )}

      {/* Friends List */}
      <section>
        {!isSelectionMode && (
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Heart className="w-3 h-3" /> My Nomads ({acceptedFriends.length})
          </h3>
        )}
        {acceptedFriends.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-white/5 rounded-2xl bg-white/5">
            <p className="text-xs text-white/20">아직 친구가 없습니다.</p>
            <p className="text-[10px] text-white/10 mt-1">커뮤니티에서 멋진 노마드를 찾아보세요!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {acceptedFriends.map(friend => (
              <FriendItem 
                key={friend.id} 
                friend={friend} 
                isSelected={selectedIds.includes(friend.id)}
                isSelectionMode={isSelectionMode}
                onSelect={() => toggleSelection(friend.id)}
                onDelete={() => handleDeleteFriend(friend.friendship_id, friend.username)}
                isProcessing={processingId === friend.friendship_id}
                onChat={() => {
                  useStore.getState().setActiveChat({
                    type: 'dm',
                    id: friend.id,
                    name: friend.username,
                    avatar_url: friend.avatar_url || undefined
                  })
                  useStore.getState().resetUnread('dm', friend.id)
                }}
                unreadCount={useStore.getState().unreadState.dms[friend.id] || 0}
              />
            ))}
          </div>
        )}
      </section>

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <section className="opacity-50">
          <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3">Sent Requests</h3>
          <div className="space-y-2">
            {sentRequests.map(req => (
              <FriendItem key={req.id} friend={req} isSent />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function FriendItem({ 
  friend, 
  onAccept, 
  onReject, 
  onChat,
  onDelete,
  isSent,
  isSelected,
  isSelectionMode,
  onSelect, 
  isProcessing,
  unreadCount = 0
}: { 
  friend: Friend, 
  onAccept?: () => void, 
  onReject?: () => void,
  onChat?: () => void,
  onDelete?: () => void,
  isSent?: boolean,
  isSelected?: boolean,
  isSelectionMode?: boolean,
  onSelect?: () => void,
  isProcessing?: boolean,
  unreadCount?: number
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => isSelectionMode && onSelect?.()}
      className={`flex items-center justify-between p-3 border rounded-2xl transition-all group ${
        isSelectionMode 
          ? isSelected 
            ? 'bg-indigo-500/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
            : 'bg-white/5 border-white/5 opacity-60'
          : 'bg-white/5 border-white/5 hover:bg-white/10'
      } ${isSelectionMode ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-3">
        {isSelectionMode && (
          <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
            isSelected ? 'bg-indigo-500 border-indigo-400' : 'bg-black/20 border-white/20'
          }`}>
            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
          </div>
        )}
        <img 
          src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`} 
          className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 shadow-lg shadow-black/20"
        />
        <div>
          <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tighter">
            {friend.username}
          </p>
          <p className="text-[10px] text-white/30 uppercase font-mono">
            {friend.status === 'accepted' ? 'Online' : isSent ? 'Waiting...' : 'Wants to connect'}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {onAccept && (
          <button 
            onClick={(e) => { e.stopPropagation(); onAccept(); }}
            disabled={isProcessing}
            className="p-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all disabled:opacity-50"
            title="Accept"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
          </button>
        )}
        {onReject && (
          <button 
            onClick={(e) => { e.stopPropagation(); onReject(); }}
            disabled={isProcessing}
            className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all disabled:opacity-50"
            title="Decline"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
          </button>
        )}
        {onChat && (
          <button 
            onClick={(e) => { e.stopPropagation(); onChat(); }}
            className="p-2 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white rounded-lg transition-all relative"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[7px] flex items-center justify-center rounded-full border border-slate-900">
                {unreadCount}
              </span>
            )}
          </button>
        )}
        {onDelete && !isSelectionMode && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={isProcessing}
            className="p-2 bg-white/5 text-white/30 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all disabled:opacity-50"
            title="친구 삭제"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
          </button>
        )}
      </div>
    </motion.div>
  )
}
