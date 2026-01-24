import { MapPin, Users, Sparkles } from "lucide-react"

interface ChatTabSwitcherProps {
  activeTab: 'city' | 'friends' | 'open'
  unreadCounts: {
    city: number
    friends: number
    open: number
  }
  onTabChange: (tab: 'city' | 'friends' | 'open') => void
}

export default function ChatTabSwitcher({ activeTab, unreadCounts, onTabChange }: ChatTabSwitcherProps) {
  return (
    <div className="flex gap-2 p-1 bg-black/20 rounded-xl border border-white/5">
      <button
        onClick={() => onTabChange('city')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all relative ${
          activeTab === 'city'
            ? "bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/20"
            : "text-white/40 hover:bg-white/5"
        }`}
      >
        <MapPin className="w-3.5 h-3.5" />
        CITY HUB
        {activeTab !== 'city' && unreadCounts.city > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-slate-900">
            {unreadCounts.city > 99 ? '99+' : unreadCounts.city}
          </span>
        )}
      </button>
      <button
        onClick={() => onTabChange('friends')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all relative ${
          activeTab === 'friends'
            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
            : "text-white/40 hover:bg-white/5"
        }`}
      >
        <Users className="w-3.5 h-3.5" />
        FRIENDS
        {activeTab !== 'friends' && unreadCounts.friends > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-slate-900">
            {unreadCounts.friends > 99 ? '99+' : unreadCounts.friends}
          </span>
        )}
      </button>
      <button
        onClick={() => onTabChange('open')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all relative ${
          activeTab === 'open'
            ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
            : "text-white/40 hover:bg-white/5"
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        OPEN
        {activeTab !== 'open' && unreadCounts.open > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-slate-900">
            {unreadCounts.open > 99 ? '99+' : unreadCounts.open}
          </span>
        )}
      </button>
    </div>
  )
}
