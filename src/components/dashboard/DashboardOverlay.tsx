import { motion } from "framer-motion"
import ClockWidget from "./ClockWidget"
import ExchangeRateWidget from "./ExchangeRateWidget"
import WeatherWidget from "./WeatherWidget"
import { MessageSquare } from "lucide-react"
import { useStore } from "@/store/useStore"
import { useAuth } from "@/store/useAuth"
import NotificationCenter from "../community/NotificationCenter"

export default function DashboardOverlay() {
  const selectedCity = useStore((state) => state.selectedCity)
  const openLoginModal = useStore((state) => state.openLoginModal)
  const openSettings = useStore((state) => state.openSettings)
  const { isChatOpen, toggleChat, isSidebarOpen } = useStore()
  const { user, profile } = useAuth()
  return (
    <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
      {/* Top Bar: Header & Status */}
      <header className="flex justify-between items-start">
        <div className="pointer-events-auto">
           <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-sm">
            {selectedCity ? selectedCity.name : "Nomad OS"}
          </h1>
          <p className="text-blue-200/80 text-sm mt-1">
            {selectedCity ? `Global Command Center • ${selectedCity.countryCode}` : "Select a city to begin"}
          </p>
        </div>

        {/* Top Right Widget Area */}
        <motion.div 
          animate={{ 
            x: (isSidebarOpen ? -384 : 0) + (isChatOpen ? -400 : 0)
          }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="flex gap-4 pointer-events-auto items-center"
        >
          {selectedCity && <ClockWidget timezone={selectedCity.timezone} />}
          
          {/* Auth Button */}
          {user ? (
            <button 
              onClick={() => openSettings()}
              className="flex items-center gap-2 p-1.5 pr-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group pointer-events-auto"
            >
              <img 
                src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                alt="Profile"
                className="w-8 h-8 rounded-full border border-cyan-500/30"
              />
              <span className="text-sm font-medium text-white/70 group-hover:text-white">
                {profile?.username || user.email?.split('@')[0]}
              </span>
            </button>
          ) : (
            <button 
              onClick={openLoginModal}
              className="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 rounded-xl text-cyan-400 text-sm font-bold transition-all backdrop-blur-md"
            >
              Login
            </button>
          )}

          {/* Notification Center */}
          <div className="pointer-events-auto">
            <NotificationCenter />
          </div>

          {/* Chat Toggle Button */}
          <button
            onClick={toggleChat}
            className={`p-3 rounded-xl border transition-all pointer-events-auto shadow-lg backdrop-blur-md ${
                isChatOpen 
                ? "bg-cyan-500 border-cyan-400 text-white shadow-cyan-500/20" 
                : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </motion.div>
      </header>

      {/* Bottom Widgets */}
      <footer className="flex gap-4 items-end pointer-events-auto">
        {selectedCity && <WeatherWidget lat={selectedCity.lat} lng={selectedCity.lng} />}
        {selectedCity && <ExchangeRateWidget targetCurrency={selectedCity.currencyCode} />}
      </footer>
    </div>
  )
}
