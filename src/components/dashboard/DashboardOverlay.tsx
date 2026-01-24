import { motion } from "framer-motion"
import ClockWidget from "./ClockWidget"
import ExchangeRateWidget from "./ExchangeRateWidget"
import WeatherWidget from "./WeatherWidget"
import { MessageSquare, MapPin, CheckCircle2, Search, X, Globe as GlobeIcon, Loader2 } from "lucide-react"
import { useStore, type City } from "@/store/useStore"
import { useAuth } from "@/store/useAuth"
import NotificationCenter from "../community/NotificationCenter"
import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useGeocoding } from "@/hooks/useGeocoding"
import { AnimatePresence } from "framer-motion"

export default function DashboardOverlay() {
  const selectedCity = useStore((state) => state.selectedCity)
  const openLoginModal = useStore((state) => state.openLoginModal)
  const openSettings = useStore((state) => state.openSettings)
  const { isChatOpen, toggleChat, isSidebarOpen, unreadState } = useStore()
  const { user, profile, fetchProfile, loading: authLoading } = useAuth()
  const [hasVisited, setHasVisited] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const isMobile = useMediaQuery("(max-width: 767px)")

  // Discovery Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { searchCity, loading: geoLoading, results: geoResults, setResults: setGeoResults } = useGeocoding()
  const { setDiscoveredCity, setSelectedCity, cities: dbCities } = useStore()

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

  const handleSelectCity = (city: City, isNew: boolean = false) => {
    if (isNew) setDiscoveredCity(city)
    setSelectedCity(city)
    setSearchQuery("")
    setGeoResults([])
    setIsSearchOpen(false)
  }

  // 위치 인증 가능 여부 (내 접속 국가와 도시 국가가 일치할 때)
  const canVerifyLocation = profile?.country_code === selectedCity?.countryCode

  return (
    <div className={`absolute inset-0 z-10 pointer-events-none p-4 md:p-6 flex flex-col justify-between ${isMobile ? 'pt-12 pb-[80px]' : ''}`}>
      {/* Top Bar: Header & Discovery Search */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
        {/* Left Section: City Info */}
        <div className="pointer-events-auto flex-1 basis-0 min-w-0 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-sm truncate">
                {selectedCity ? selectedCity.name : "Nomad OS"}
            </h1>
            
            {/* Verification Badge/Button */}
            {user && selectedCity && (
                hasVisited ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 md:px-2.5 md:py-1 bg-green-500/10 border border-green-500/30 rounded-full shrink-0">
                        <CheckCircle2 className="w-3 md:w-3.5 h-3 md:h-3.5 text-green-400" />
                        <span className="text-[8px] md:text-[10px] font-bold text-green-400 uppercase tracking-tighter">Verified</span>
                    </div>
                ) : (
                    <button 
                        onClick={handleCheckIn}
                        disabled={checkingIn || !canVerifyLocation}
                        className={`flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 border rounded-full transition-all group shrink-0 ${
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
          <p className="text-blue-200/80 text-[10px] md:text-sm mt-0.5 truncate">
            {selectedCity ? `Global Command Center • ${selectedCity.countryCode}` : "Select a city to begin"}
          </p>
        </div>

        {/* --- Central Discovery Search Bar --- */}
        <div className="pointer-events-auto flex flex-col items-center w-full max-w-[280px] md:max-w-xs lg:max-w-md px-0 md:px-4 z-20">
          <div className={`relative w-full flex items-center transition-all duration-300 ${isSearchOpen ? 'bg-slate-900 shadow-2xl ring-1 ring-cyan-500/30' : 'bg-white/5 hover:bg-white/10'} rounded-2xl overflow-hidden`}>
            <div className="flex-1 flex items-center px-4 py-2.5">
              <Search className={`w-4 h-4 transition-colors ${isSearchOpen ? 'text-cyan-400' : 'text-white/30'}`} />
              <input
                type="text"
                placeholder="어디로 떠날까요?"
                className="bg-transparent border-none focus:ring-0 text-sm text-white placeholder:text-white/20 w-full ml-2 outline-none"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCity(searchQuery)}
              />
            </div>
            {isSearchOpen && (
              <button 
                onClick={() => {
                   setIsSearchOpen(false)
                   setSearchQuery("")
                   setGeoResults([])
                }}
                className="px-4 py-2 text-white/30 hover:text-white transition-colors border-l border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {isSearchOpen && (searchQuery.length >= 2 || geoResults.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 w-full max-w-[280px] md:max-w-xs lg:max-w-md bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[300px]"
              >
                {/* 1. DB Matching Cities */}
                {dbCities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(city => (
                  <button
                    key={`db-${city.name}`}
                    onClick={() => handleSelectCity(city)}
                    className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center justify-between group border-b border-white/5"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{city.name}</span>
                      <span className="text-[10px] text-white/40 uppercase">{city.countryCode} • Activated</span>
                    </div>
                    <GlobeIcon className="w-4 h-4 text-cyan-500/50 group-hover:text-cyan-400" />
                  </button>
                ))}

                {/* 2. Global Search Trigger */}
                <button
                  onClick={() => searchCity(searchQuery)}
                  disabled={geoLoading}
                  className="w-full px-4 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] md:text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  전 세계 데이터베이스 검색
                </button>

                {/* 3. Global Geocoding Results */}
                <div className="overflow-y-auto no-scrollbar">
                  {geoResults.map((res, i) => (
                    <button
                      key={`geo-${i}`}
                      onClick={() => handleSelectCity(res, true)}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 border-b border-white/5 last:border-0 group flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white/80 group-hover:text-cyan-300">{res.name}</span>
                        <span className="text-[10px] text-white/30 uppercase">{res.countryCode} • Discovery Candidate</span>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Section: Widgets (Hidden on Mobile) */}
        {!isMobile ? (
          <motion.div 
            animate={{ 
              x: (isSidebarOpen ? -384 : 0) + (isChatOpen ? -400 : 0)
            }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="flex-1 basis-0 flex justify-end gap-3 lg:gap-4 pointer-events-auto items-center"
          >
            {selectedCity && <div className="hidden lg:block"><ClockWidget timezone={selectedCity.timezone} /></div>}
            
            {/* Auth Button */}
            {user ? (
              <button
                onClick={() => openSettings()}
                className="flex items-center gap-2 p-1.5 pr-3 lg:pr-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group pointer-events-auto shrink-0"
              >
                <img
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                  alt="Profile"
                  className="w-7 h-7 lg:w-8 lg:h-8 rounded-full border border-cyan-500/30"
                />
                {authLoading || !profile ? (
                  <div className="h-4 w-16 lg:w-20 bg-white/10 rounded animate-pulse" />
                ) : (
                  <span className="text-xs lg:text-sm font-medium text-white/70 group-hover:text-white truncate max-w-[80px] lg:max-w-[120px]">
                    {profile.username}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={openLoginModal}
                className="px-3 lg:px-4 py-1.5 lg:py-2 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 rounded-xl text-cyan-400 text-xs lg:text-sm font-bold transition-all backdrop-blur-md shrink-0"
              >
                Login
              </button>
            )}

            {/* Notification Center */}
            <div className="pointer-events-auto shrink-0">
              <NotificationCenter />
            </div>

            {/* Chat Toggle Button */}
            <button
              onClick={toggleChat}
              className={`p-2.5 lg:p-3 rounded-xl border transition-all pointer-events-auto shadow-lg backdrop-blur-md relative shrink-0 ${
                  isChatOpen 
                  ? "bg-cyan-500 border-cyan-400 text-white shadow-cyan-500/20" 
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5" />
              {(unreadState.city + 
                Object.values(unreadState.dms).reduce((a: number, b: number) => a + b, 0) + 
                Object.values(unreadState.rooms).reduce((a: number, b: number) => a + b, 0)) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 text-white text-[8px] lg:text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-slate-900 animate-in zoom-in duration-300">
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
        ) : (
          <div className="flex-1 basis-0" />
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
