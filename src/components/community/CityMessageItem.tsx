import { motion } from "framer-motion"
import type { CityMessage } from "@/types/city-chat"
import { getFlagEmoji } from "@/types/city-chat"

interface CityMessageItemProps {
  message: CityMessage
  isOwn: boolean
  onProfileClick: () => void
}

export default function CityMessageItem({ message, isOwn, onProfileClick }: CityMessageItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      <img
        src={message.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.author_id}`}
        className="w-8 h-8 rounded-lg border border-white/10 bg-slate-800 cursor-pointer hover:ring-2 hover:ring-cyan-500/50 transition-all"
        alt="Avatar"
        onClick={onProfileClick}
      />
      <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : ''}`}>
        <div className="flex items-center gap-1.5 mb-1">
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-[9px] group relative">
            <span className="drop-shadow-sm">
              {getFlagEmoji(message.profiles?.country_code || 'KR')}
            </span>
            <span className="text-cyan-400/80 font-mono font-bold tracking-tighter uppercase">
              Signal
            </span>
            {/* Tooltip */}
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-800 text-[8px] text-cyan-300 px-2 py-1 rounded border border-cyan-500/30 whitespace-nowrap z-50">
              Location Verified via IP-Trace
            </div>
          </div>
          <span
            className="text-[10px] font-bold text-white/50 hover:text-white cursor-pointer uppercase tracking-widest pl-1 transition-colors"
            onClick={onProfileClick}
          >
            {message.profiles?.username || 'Unknown'}
          </span>
          <span className="text-[8px] text-white/20 font-mono">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className={`p-3 rounded-2xl text-xs font-mono leading-relaxed ${
          isOwn
            ? 'bg-cyan-500/20 text-cyan-50 border border-cyan-500/30 rounded-tr-none'
            : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'
        }`}>
          {message.content}
        </div>
      </div>
    </motion.div>
  )
}
