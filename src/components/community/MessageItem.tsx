import { motion } from "framer-motion"
import { LogOut } from "lucide-react"
import type { DMMessage } from "@/types/message"

interface MessageItemProps {
  message: DMMessage
  isOwn: boolean
  isThemeAmber: boolean
}

export default function MessageItem({ message, isOwn, isThemeAmber }: MessageItemProps) {
  // [SYSTEM] 메시지 처리
  if (message.content.startsWith('[SYSTEM]')) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-4"
      >
        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-white/30 font-mono tracking-tighter border border-white/5 flex items-center gap-2">
          <LogOut className="w-3 h-3" />
          {message.content.replace('[SYSTEM]', '').trim()}
        </span>
      </motion.div>
    )
  }

  const senderProfile = message.sender || (message.profiles as any)
  const username = senderProfile?.username || message.nickname || 'Unknown'
  const avatarUrl = senderProfile?.avatar_url
  const countryCode = senderProfile?.country_code

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
    >
      {!isOwn && (
        <div className="flex items-center gap-2 mb-1 px-1">
          {avatarUrl && (
            <img src={avatarUrl} className="w-4 h-4 rounded-full bg-slate-800 object-cover" />
          )}
          <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1">
            {countryCode && <span>{countryCode}</span>}
            {message.is_anonymous ? message.nickname : username}
          </span>
        </div>
      )}
      <div className={`max-w-[85%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-xs font-mono shadow-lg border ${
          isOwn
            ? isThemeAmber
              ? 'bg-gradient-to-br from-amber-600/30 to-orange-700/30 text-amber-50 border-amber-500/40 rounded-tr-none'
              : 'bg-gradient-to-br from-indigo-500/20 to-blue-600/20 text-indigo-50 border-indigo-500/30 rounded-tr-none'
            : 'bg-white/5 text-white/90 border-white/10 rounded-tl-none'
        }`}>
          {message.content}
        </div>
        <span className="text-[8px] text-white/20 font-mono mt-1 px-1">
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  )
}
