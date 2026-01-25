import { Hash, Users } from "lucide-react"

interface OpenChatRoomItemProps {
  name: string
  description?: string
  tags?: string[]
  onClick: () => void
  unreadCount?: number
}

export default function OpenChatRoomItem({ name, description, tags, onClick, unreadCount }: OpenChatRoomItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-amber-500/30 transition-all text-left group relative flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-900 transition-all">
            <Hash className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors uppercase tracking-tight">
            {name}
          </span>
        </div>
        {unreadCount !== undefined && unreadCount > 0 && (
          <span className="w-5 h-5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full border border-slate-900 shadow-lg font-bold">
            {unreadCount}
          </span>
        )}
      </div>

      {description && (
        <p className="text-[10px] text-white/40 line-clamp-1 font-medium leading-relaxed">
          {description}
        </p>
      )}

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {tags.map((tag, i) => (
            <span key={i} className="text-[9px] text-amber-500/60 font-mono bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
         <Users className="w-3.5 h-3.5 text-white/20" />
      </div>
    </button>
  )
}
