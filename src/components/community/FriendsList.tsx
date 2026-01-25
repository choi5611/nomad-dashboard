import { useState } from "react"
import { useAuth } from "@/store/useAuth"
import { useStore } from "@/store/useStore"
import { Loader2, Heart, Users, MessageSquare, Pencil, Check, X, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { useFriends } from "@/hooks/useFriends"
import { useChatRooms } from "@/hooks/useChatRooms"
import FriendItem from "./FriendItem"
import type { ChatRoom } from "@/types/friend"

// 개별 채팅방 아이템 컴포넌트
interface ChatRoomItemProps {
  room: ChatRoom
  isLounge?: boolean
  editingRoomId: string | null
  editingName: string
  setEditingName: (name: string) => void
  setEditingRoomId: (id: string | null) => void
  handleUpdateRoomName: (id: string) => void
  currentUserId?: string
}

function ChatRoomItem({
  room,
  isLounge,
  editingRoomId,
  editingName,
  setEditingName,
  setEditingRoomId,
  handleUpdateRoomName,
  currentUserId
}: ChatRoomItemProps) {
  const isEditing = editingRoomId === room.id
  const unreadCount = useStore.getState().unreadState.rooms[room.id] || 0

  // 오픈채팅/비밀채팅의 경우 개설자만 수정 가능
  // 일반 그룹채팅(created_by가 없는 경우)은 모두 수정 가능
  const canEdit = !room.created_by || room.created_by === currentUserId

  return (
    <div
      onClick={() => {
        if (!isEditing) {
          useStore.getState().setActiveChat({
            type: room.is_open ? 'open' : 'group',
            id: room.id,
            name: room.custom_name || room.name
          })
          useStore.getState().resetUnread('room', room.id)
        }
      }}
      className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
          isLounge 
            ? "bg-amber-500/20 border-amber-500/30 text-amber-500" 
            : "bg-purple-500/20 border-purple-500/30 text-purple-400"
        }`}>
          {isLounge ? <Sparkles className="w-5 h-5" /> : <Users className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
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
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white uppercase tracking-tighter truncate">
                {room.custom_name || room.name}
              </p>
              {canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingRoomId(room.id)
                    setEditingName(room.custom_name || room.name)
                  }}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded text-white/40 hover:text-white transition-all"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
          <p className="text-[10px] text-white/30 uppercase font-mono">
            {isLounge ? 'Public Lounge' : 'Private Group'}
          </p>
        </div>
      </div>
      {unreadCount > 0 && (
        <span className="w-5 h-5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full border border-slate-900 shadow-lg font-bold">
          {unreadCount}
        </span>
      )}
    </div>
  )
}

export default function FriendsList() {
  const { user, profile } = useAuth()
  
  const {
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
  } = useFriends(user, profile)

  const {
    chatRooms,
    editingRoomId,
    setEditingRoomId,
    editingName,
    setEditingName,
    handleUpdateRoomName,
    fetchChatRooms
  } = useChatRooms(user)

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
    </div>
  )

  if (!user) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <Users className="w-12 h-12 text-white/20" />
      <h3 className="text-sm font-semibold text-white">로그인이 필요합니다</h3>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto space-y-6 pr-2 no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
          <Heart className="w-3 h-3" /> Nomads ({acceptedFriends.length})
        </h3>
        {acceptedFriends.length > 0 && (
          <button
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${
              isSelectionMode ? "bg-indigo-500 text-white border-indigo-400" : "bg-white/5 text-white/60 border-white/10"
            }`}
          >
            {isSelectionMode ? "취소" : "그룹 생성"}
          </button>
        )}
      </div>

      {isSelectionMode && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
          <p className="text-[10px] text-indigo-300 font-bold uppercase">{selectedIds.length}명 선택됨</p>
          <button
            onClick={() => handleCreateGroup(fetchChatRooms)}
            disabled={selectedIds.length === 0 || isCreating}
            className="px-4 py-1.5 bg-indigo-500 text-white text-[10px] font-bold rounded-lg"
          >
            {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : "채팅 시작"}
          </button>
        </motion.div>
      )}

      {/* Room Categories */}
      {chatRooms.length > 0 && !isSelectionMode && (
        <div className="space-y-6">
          {/* Private Crews */}
          {chatRooms.filter(r => !r.is_open).length > 0 && (
            <section>
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> My Crews
              </h3>
              <div className="space-y-2">
                {chatRooms.filter(r => !r.is_open).map(room => (
                  <ChatRoomItem
                    key={room.id}
                    room={room}
                    editingRoomId={editingRoomId}
                    editingName={editingName}
                    setEditingName={setEditingName}
                    setEditingRoomId={setEditingRoomId}
                    handleUpdateRoomName={handleUpdateRoomName}
                    currentUserId={user?.id}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Joined Lounges */}
          {chatRooms.filter(r => r.is_open).length > 0 && (
            <section>
              <h3 className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Joined Lounges
              </h3>
              <div className="space-y-2">
                {chatRooms.filter(r => r.is_open).map(room => (
                  <ChatRoomItem
                    key={room.id}
                    room={room}
                    isLounge
                    editingRoomId={editingRoomId}
                    editingName={editingName}
                    setEditingName={setEditingName}
                    setEditingRoomId={setEditingRoomId}
                    handleUpdateRoomName={handleUpdateRoomName}
                    currentUserId={user?.id}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <section>
          <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3">New Requests</h3>
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

      {/* DMs / Nomads */}
      <section>
        {!isSelectionMode && (
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
            <MessageSquare className="w-3 h-3" /> Direct Messages
          </h3>
        )}
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
