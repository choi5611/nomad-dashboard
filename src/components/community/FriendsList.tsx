import { useAuth } from "@/store/useAuth"
import { useStore } from "@/store/useStore"
import { Loader2, UserPlus, Heart, Users, MessageSquare, Pencil, Check, X } from "lucide-react"
import { motion } from "framer-motion"
import { useFriends } from "@/hooks/useFriends"
import { useChatRooms } from "@/hooks/useChatRooms"
import FriendItem from "./FriendItem"

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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    )
  }

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
            onClick={() => handleCreateGroup(fetchChatRooms)}
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
