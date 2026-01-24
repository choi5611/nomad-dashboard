import { motion } from "framer-motion"
import ClockWidget from "./ClockWidget"
import ExchangeRateWidget from "./ExchangeRateWidget"
import WeatherWidget from "./WeatherWidget"
import { MessageSquare, MapPin, CheckCircle2 } from "lucide-react"
import { useStore } from "@/store/useStore"
import { useAuth } from "@/store/useAuth"
import NotificationCenter from "../community/NotificationCenter"
import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useMediaQuery } from "@/hooks/useMediaQuery"

export default function DashboardOverlay() {
  const selectedCity = useStore((state) => state.selectedCity)
  const openLoginModal = useStore((state) => state.openLoginModal)
  const openSettings = useStore((state) => state.openSettings)
  const { isChatOpen, toggleChat, isSidebarOpen, unreadState } = useStore()
  const { user, profile, fetchProfile, loading: authLoading } = useAuth()
  const [hasVisited, setHasVisited] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // 방문 여부 확인
  useEffect(() => {
    const checkVisit = async () => {
      if (!user || !selectedCity) return
      
      const { data, error } = await supabase
        .from('visits')
        .select('id')
        .eq('user_id', user.id)
        .eq('city_id', selectedCity.name.toLowerCase())
        .maybeSingle()
      
      if (!error && data) {
        setHasVisited(true)
      } else {
        setHasVisited(false)
      }
    }

    checkVisit()
  }, [user, selectedCity])

  const handleCheckIn = useCallback(async () => {
    if (!user || !selectedCity || checkingIn) return
    
    setCheckingIn(true)
    try {
      const { error } = await supabase
        .from('visits')
        .insert({
          user_id: user.id,
          city_id: selectedCity.name.toLowerCase()
        })
      
      if (error) {
        if (error.code === '23505') {
            toast.error("이미 방문 인증된 도시입니다.")
        } else {
            throw error
        }
      } else {
        setHasVisited(true)
        toast.success(`${selectedCity.name} 방문 인증 완료! (+50 XP)`)
        fetchProfile(user.id) // XP 갱신
      }
    } catch (e: any) {
      toast.error("방문 인증 실패: " + (e.message || "알 수 없는 에러"))
    } finally {
      setCheckingIn(false)
    }
  }, [user, selectedCity, checkingIn, fetchProfile])

  // 위치 인증 가능 여부 (내 접속 국가와 도시 국가가 일치할 때)
  const canVerifyLocation = profile?.country_code === selectedCity?.countryCode

  return (
    <div className={`absolute inset-0 z-10 pointer-events-none p-4 md:p-6 flex flex-col justify-between ${isMobile ? 'pt-12 pb-[80px]' : ''}`}>
      {/* Top Bar: Header & Status */}
      <header className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="pointer-events-auto">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-sm">
                {selectedCity ? selectedCity.name : "Nomad OS"}
            </h1>
            
            {/* Verification Badge/Button */}
            {user && selectedCity && (
                hasVisited ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 md:px-2.5 md:py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                        <CheckCircle2 className="w-3 md:w-3.5 h-3 md:h-3.5 text-green-400" />
                        <span className="text-[8px] md:text-[10px] font-bold text-green-400 uppercase tracking-tighter">Verified</span>
                    </div>
                ) : (
                    <button 
                        onClick={handleCheckIn}
                        disabled={checkingIn || !canVerifyLocation}
                        className={`flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 border rounded-full transition-all group ${
                            canVerifyLocation 
                            ? "bg-cyan-500/20 hover:bg-cyan-500/40 border-cyan-500/30" 
                            : "bg-white/5 border-white/5 opacity-40 cursor-not-allowed"
                        }`}
                    >
                        <MapPin className={`w-3 md:w-3.5 h-3 md:h-3.5 ${canVerifyLocation ? "text-cyan-400 group-hover:animate-bounce" : "text-white/20"}`} />
                        <span className={`text-[8px] md:text-[10px] font-bold uppercase tracking-tighter ${canVerifyLocation ? "text-cyan-400" : "text-white/20"}`}>
                            {checkingIn ? "Wait" : canVerifyLocation ? "Verify" : "Locked"}
                        </span>
                    </button>
                )
            )}
          </div>
          <p className="text-blue-200/80 text-[10px] md:text-sm mt-0.5">
            {selectedCity ? `Global Command Center • ${selectedCity.countryCode}` : "Select a city to begin"}
          </p>
        </div>

        {/* Top Right Widget Area - Hidden on Mobile */}
        {!isMobile && (
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
                {authLoading || !profile ? (
                  <div className="h-5 w-20 bg-white/10 rounded animate-pulse" />
                ) : (
                  <span className="text-sm font-medium text-white/70 group-hover:text-white">
                    {profile.username}
                  </span>
                )}
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
              className={`p-3 rounded-xl border transition-all pointer-events-auto shadow-lg backdrop-blur-md relative ${
                  isChatOpen 
                  ? "bg-cyan-500 border-cyan-400 text-white shadow-cyan-500/20" 
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              {(unreadState.city + 
                Object.values(unreadState.dms).reduce((a: number, b: number) => a + b, 0) + 
                Object.values(unreadState.rooms).reduce((a: number, b: number) => a + b, 0)) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-slate-900 animate-in zoom-in duration-300">
                  {(unreadState.city + 
                    Object.values(unreadState.dms).reduce((a: number, b: number) => a + b, 0) + 
                    Object.values(unreadState.rooms).reduce((a: number, b: number) => a + b, 0)) > 99 ? '99+' : 
                    (unreadState.city + 
                     Object.values(unreadState.dms).reduce((a: number, b: number) => a + b, 0) + 
                     Object.values(unreadState.rooms).reduce((a: number, b: number) => a + b, 0))}
                </span>
              )}
            </button>
          </motion.div>
        )}
      </header>

      {/* Bottom Widgets */}
      <footer className="flex gap-4 items-end pointer-events-auto">
        {selectedCity && <WeatherWidget lat={selectedCity.lat} lng={selectedCity.lng} />}
        {selectedCity && <ExchangeRateWidget targetCurrency={selectedCity.currencyCode} />}
      </footer>
    </div>
  )
}
