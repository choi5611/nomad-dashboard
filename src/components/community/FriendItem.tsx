import { motion } from "framer-motion"
import { UserCheck, UserX, MessageSquare, Loader2, UserMinus } from "lucide-react"
import type { Friend } from "@/types/friend"

interface FriendItemProps {
  friend: Friend
  onAccept?: () => void
  onReject?: () => void
  onChat?: () => void
  onDelete?: () => void
  isSent?: boolean
  isSelected?: boolean
  isSelectionMode?: boolean
  onSelect?: () => void
  isProcessing?: boolean
  unreadCount?: number
}

export default function FriendItem({
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
}: FriendItemProps) {
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
