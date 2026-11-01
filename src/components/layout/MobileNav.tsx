import { Globe, MessageSquare, Users, Settings } from "lucide-react"
import { useStore } from "@/store/useStore"
import { motion } from "framer-motion"

export default function MobileNav() {
  const { isSidebarOpen, isChatOpen, isSettingsOpen, setActiveView, unreadState, activeChat } = useStore()
  
  // 현재 어떤 뷰가 활성화되어 있는지 판단
  let activeView: 'globe' | 'community' | 'chat' | 'settings' = 'globe'
  if (isSettingsOpen) activeView = 'settings'
  else if (isChatOpen || activeChat) activeView = 'chat'
  else if (isSidebarOpen) activeView = 'community'

  const totalUnread = unreadState.city + 
    Object.values(unreadState.dms).reduce((a, b) => a + b, 0) + 
    Object.values(unreadState.rooms).reduce((a, b) => a + b, 0)

  const navItems = [
    { id: 'globe', icon: Globe, label: 'Explore' },
    { id: 'community', icon: Users, label: 'Feed' },
    { id: 'chat', icon: MessageSquare, label: 'Chat', badge: totalUnread },
    { id: 'settings', icon: Settings, label: 'Me' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-slate-900/95 border-t border-white/10 z-[100] flex items-center justify-around px-2 pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = activeView === item.id

        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as any)}
            className={`relative flex flex-col items-center gap-1 p-2 transition-all ${
              isActive ? "text-cyan-400" : "text-white/40"
            }`}
          >
            <div className="relative">
              <Icon className={`w-6 h-6 ${isActive ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : ""}`} />
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full px-1 border border-slate-900">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              {item.label}
            </span>
            
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-[2px] w-12 h-[3px] bg-cyan-400 rounded-full"
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
