import { ChevronLeft, Sparkles, LogOut, Settings, UserPlus } from "lucide-react"
import type { ChatInfo } from "@/types/message"

interface ChatHeaderProps {
  chat: ChatInfo
  anonNickname: string
  onBack: () => void
  onLeave?: () => void
  onEdit?: () => void
  onInvite?: () => void
}

export default function ChatHeader({ chat, anonNickname, onBack, onLeave, onEdit, onInvite }: ChatHeaderProps) {
  const isThemeAmber = chat.type === 'open'

  return (
    <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="relative">
          {chat.type === 'open' ? (
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
          ) : (
            <>
              <img
                src={chat.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`}
                className="w-8 h-8 rounded-full border border-white/20 bg-slate-800"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full" />
            </>
          )}
        </div>
        <div>
          <h3 className={`text-xs font-bold text-white uppercase tracking-tighter ${isThemeAmber ? 'text-amber-400' : ''}`}>
            {chat.type === 'open' ? `# ${chat.name}` : chat.name}
          </h3>
          <p className={`text-[10px] font-mono tracking-tighter uppercase flex items-center gap-1 ${isThemeAmber ? 'text-amber-500/70' : 'text-green-400'}`}>
            <Sparkles className="w-2 h-2" /> {chat.type === 'open' ? 'Anonymous Session' : 'Encrypted Link'}
            {chat.type === 'open' && <span className="ml-2 text-white/40">as {anonNickname}</span>}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Invite Button */}
        {onInvite && (
          <button
            onClick={onInvite}
            className="p-2 hover:bg-white/10 rounded-lg text-white/30 hover:text-indigo-400 transition-all group relative"
            title="Invite Nomads"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        )}

        {/* Edit Button (For Owners) */}
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 hover:bg-white/10 rounded-lg text-white/30 hover:text-amber-400 transition-all"
            title="Room Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* Leave/Exit Button */}
        {(chat.type === 'group' || chat.type === 'open') && onLeave && (
          <button
            onClick={onLeave}
            className="p-2 hover:bg-red-500/10 rounded-lg text-white/30 hover:text-red-400 transition-all group relative"
            title={chat.type === 'open' ? 'Exit Lounge' : 'Leave Group'}
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
