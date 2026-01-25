import { useState, useEffect, useCallback } from "react"
import DashboardOverlay from "@/components/dashboard/DashboardOverlay"
import Scene from "@/components/canvas/Scene"
import CommunitySidebar from "@/components/community/CommunitySidebar"
import ChatSidebar from "@/components/community/ChatSidebar"
import LoginModal from "@/components/auth/LoginModal"
import SettingsSidebar from "@/components/dashboard/SettingsSidebar"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/store/useAuth"
import { useStore } from "@/store/useStore"
import { Toaster } from "sonner"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import MobileNav from "@/components/layout/MobileNav"

function App() {
  const setSession = useAuth((state) => state.setSession)
  const setSelectedCity = useStore((state) => state.setSelectedCity)
  const { user } = useAuth()
  const [hasDetectedLocation, setHasDetectedLocation] = useState(false)
  const isMobile = useMediaQuery("(max-width: 767px)")
  const cities = useStore((state) => state.cities)
  const fetchCities = useStore((state) => state.fetchCities)

  // 1. 초기 도시 데이터 로드
  useEffect(() => {
    fetchCities()
  }, [fetchCities])

  // Helper functions
  const applyLocation = useCallback((countryCode: string) => {
    // 💡 이제 DB에서 가져온 cities 배열에서 찾습니다.
    const matchingCity = cities.find(c => c.countryCode === countryCode)
    if (matchingCity) {
      setSelectedCity(matchingCity, false)
    }
    setHasDetectedLocation(true)
  }, [setSelectedCity, cities])

  const detectAndSetInitialLocation = useCallback(async () => {
    let detectedCountry = ""

    try {
      const res = await fetch("https://ipwho.is/")
      const data = await res.json()
      if (data && data.country_code) {
        detectedCountry = data.country_code
      }
    } catch {
      const locale = navigator.language || (navigator as any).userLanguage
      if (locale && locale.includes("-")) {
        detectedCountry = locale.split("-")[1].toUpperCase()
      }
    }

    if (detectedCountry) {
      sessionStorage.setItem("nomad_location_detected", detectedCountry)
      applyLocation(detectedCountry)

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        supabase.from("profiles").update({ country_code: detectedCountry }).eq("id", session.user.id).then()
      }
    } else {
      setHasDetectedLocation(true)
    }
  }, [applyLocation])

  const updateUserLocation = useCallback(async (userId: string) => {
    const cached = sessionStorage.getItem("nomad_location_detected")
    if (cached) {
      await supabase.from("profiles").update({ country_code: cached }).eq("id", userId)
      return
    }
    detectAndSetInitialLocation()
  }, [detectAndSetInitialLocation])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (_event === 'SIGNED_OUT') {
        const { closeChat, setActiveChat, setActiveTab } = useStore.getState()
        closeChat()
        setActiveChat(null)
        setActiveTab('city')
      }
      if (session?.user) {
        updateUserLocation(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [setSession, updateUserLocation])

  useEffect(() => {
    const cachedLocation = sessionStorage.getItem("nomad_location_detected")
    if (!hasDetectedLocation) {
      const timeout = setTimeout(() => {
        if (!cachedLocation) {
          detectAndSetInitialLocation()
        } else {
          applyLocation(cachedLocation)
        }
      }, 0)
      return () => clearTimeout(timeout)
    }
  }, [hasDetectedLocation, detectAndSetInitialLocation, applyLocation])

  // Joined Rooms Sync
  useEffect(() => {
    if (!user) {
      useStore.setState({ joinedRooms: [] })
      return
    }
    
    const { fetchJoinedRooms } = useStore.getState()
    fetchJoinedRooms(user.id)

    // 멤버십 또는 방 정보 변경 시 동기화
    const channel = supabase.channel('joined-rooms-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `user_id=eq.${user.id}` }, () => fetchJoinedRooms(user.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, () => fetchJoinedRooms(user.id))
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Notifications
  useEffect(() => {
    if (!user) return
    const { incrementUnread } = useStore.getState()
    const currentUserId = user.id

    const cityChannel = supabase.channel('global-chat-tracker')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const { isChatOpen, selectedCity, activeTab } = useStore.getState()
        if (payload.new.author_id !== currentUserId) {
           const isVisible = isChatOpen && activeTab === 'city' && selectedCity?.name.toLowerCase() === payload.new.city_id
           if (!isVisible) incrementUnread('city')
        }
      })
      .subscribe()

    const dmChannel = supabase.channel('global-dm-tracker')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, async (payload) => {
        const { isChatOpen, activeChat, activeTab, joinedRooms } = useStore.getState()
        if (payload.new.sender_id !== currentUserId) {
          if (payload.new.receiver_id === currentUserId) {
            const isVisible = isChatOpen && activeTab === 'friends' && activeChat?.type === 'dm' && activeChat?.id === payload.new.sender_id
            if (!isVisible) incrementUnread('dm', payload.new.sender_id)
          } else if (payload.new.room_id) {
            // 내가 실제로 가입한 방인지 엄격하게 체크
            const room = joinedRooms.find(r => r.id === payload.new.room_id)
            if (!room) return

            const targetTab = room.is_open ? 'open' : 'friends'
            const isVisible = isChatOpen && activeTab === targetTab && activeChat?.id === payload.new.room_id
            if (!isVisible) incrementUnread('room', payload.new.room_id)
          }
        }
      })
      .subscribe()

    const groupChannel = supabase.channel('global-group-tracker')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, (payload) => {
        const { isChatOpen, activeChat, activeTab, joinedRooms } = useStore.getState()
        if (payload.new.user_id !== currentUserId) {
             const room = joinedRooms.find(r => r.id === payload.new.room_id)
             if (!room) return

             const isVisible = isChatOpen && activeTab === 'friends' && activeChat?.id === payload.new.room_id
             if (!isVisible) incrementUnread('room', payload.new.room_id)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(cityChannel)
      supabase.removeChannel(dmChannel)
      supabase.removeChannel(groupChannel)
    }
  }, [user])

  const isLoginModalOpen = useStore((state) => state.isLoginModalOpen)
  const closeLoginModal = useStore((state) => state.closeLoginModal)

  return (
    <div className={`relative w-full h-screen overflow-hidden bg-black text-white ${isMobile ? 'pb-[72px]' : ''}`}>
      <Scene />
      <DashboardOverlay />
      <CommunitySidebar />
      <ChatSidebar />
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
      <SettingsSidebar />
      {isMobile && <MobileNav />}
      <Toaster position="top-center" richColors />
    </div>
  )
}

export default App
