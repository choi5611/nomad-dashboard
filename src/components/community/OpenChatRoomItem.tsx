interface OpenChatRoomItemProps {
  name: string
  participants: number
  onClick: () => void
  unreadCount?: number
}

export default function OpenChatRoomItem({ name, participants, onClick, unreadCount }: OpenChatRoomItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-amber-500/30 transition-all text-left group relative"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-white group-hover:text-amber-400"># {name}</span>
        <span className="text-[10px] text-white/20 font-mono">{participants} Active</span>
      </div>
      <p className="text-[10px] text-white/40 uppercase tracking-tighter">Tap to join anonymously</p>
      {unreadCount !== undefined && unreadCount > 0 && (
        <span className="absolute top-4 right-4 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-slate-900 shadow-lg">
          {unreadCount}
        </span>
      )}
    </button>
  )
}
