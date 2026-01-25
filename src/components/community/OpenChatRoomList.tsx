import { useState, useEffect } from "react"
import { Sparkles, Plus, Loader2, Search } from "lucide-react"
import OpenChatRoomItem from "./OpenChatRoomItem"
import { supabase } from "@/lib/supabase"
import type { ChatRoom } from "@/types/friend"
import type { User } from "@supabase/supabase-js"
import CreateChatModal from "./CreateChatModal"
import RoomPreviewModal from "./RoomPreviewModal" // 추가

interface OpenChatRoomListProps {
  user: User | null
  unreadState: { rooms: Record<string, number> }
  onRoomClick: (roomId: string, roomName: string) => void
  onRoomCreated?: (roomId: string, roomName: string, isOpen: boolean) => void
}

export default function OpenChatRoomList({ user, unreadState, onRoomClick, onRoomCreated }: OpenChatRoomListProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [joinedRoomIds, setJoinedRoomIds] = useState<Set<string>>(new Set()) // 추가: 참여 중인 방 ID들
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchRooms = async () => {
    try {
      // 1. 참여 중인 방 목록 가져오기
      if (user) {
        const { data: membership } = await supabase
          .from('room_members')
          .select('room_id')
          .eq('user_id', user.id)
        if (membership) {
          setJoinedRoomIds(new Set(membership.map(m => m.room_id)))
        }
      }

      // 2. 공개 방 목록 가져오기
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_open', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRooms(data || [])
    } catch (err) {
      console.error('Error fetching open rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()

    // 실시간 구독
    const channel = supabase
      .channel('open_rooms_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms', filter: 'is_open=eq.true' }, () => {
        fetchRooms()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `user_id=eq.${user?.id}` }, () => {
        fetchRooms()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const handleRoomClick = (room: ChatRoom) => {
    // 이미 참여 중인 방이면 미리보기 없이 바로 입장
    if (joinedRoomIds.has(room.id)) {
      onRoomClick(room.id, room.name)
      return
    }
    setSelectedRoom(room)
    setIsPreviewOpen(true)
  }

  const handleJoin = async (roomId: string, roomName: string) => {
    if (!user) return

    try {
      // room_members에 추가 (이미 있으면 ignore)
      const { error } = await supabase
        .from('room_members')
        .insert({ room_id: roomId, user_id: user.id })
        .select()

      // 에러가 나더라도 (이미 있는 경우 등) 입장은 진행
      setIsPreviewOpen(false)
      onRoomClick(roomId, roomName)
    } catch (err) {
      console.error('Join error:', err)
      onRoomClick(roomId, roomName)
    }
  }

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header & Actions */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Anonymous Lounges
          </h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl text-[10px] font-bold transition-all group"
          >
            <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform" />
            CREATE LOUNGE
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-3.5 h-3.5 text-white/20 group-focus-within:text-amber-500 transition-colors" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, description, tags..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all font-mono"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 grayscale opacity-50">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <p className="text-[10px] text-white font-mono tracking-widest uppercase">Syncing Lounges...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white/10" />
            </div>
            <div>
              <p className="text-xs text-white/40 font-bold">건색 결과가 없습니다.</p>
              <p className="text-[9px] text-white/20 uppercase mt-1">Be the first to create a lounge!</p>
            </div>
          </div>
        ) : (
          filteredRooms.map(room => (
            <OpenChatRoomItem
              key={room.id}
              name={room.name}
              description={room.description || ""}
              tags={room.tags || []}
              unreadCount={unreadState.rooms[room.id] || 0}
              onClick={() => handleRoomClick(room)}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <CreateChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        onSuccess={(id, name, isOpen) => {
          if (onRoomCreated) {
            onRoomCreated(id, name, isOpen ?? true)
          } else {
            onRoomClick(id, name)
          }
          fetchRooms()
        }}
      />

      <RoomPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        room={selectedRoom}
        onJoin={handleJoin}
      />
    </div>
  )
}
