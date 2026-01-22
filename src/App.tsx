import { useEffect } from "react"
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
import { CITIES } from "@/data/cities"
import { useState } from "react"

function App() {
  const setSession = useAuth((state) => state.setSession)
  const setSelectedCity = useStore((state) => state.setSelectedCity)
  const [hasDetectedLocation, setHasDetectedLocation] = useState(false)

  useEffect(() => {
    // 현재 세션 가져오기
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      
      // 로그인이 감지되면 자동으로 국가 업데이트
      if (session?.user) {
        updateUserLocation(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [setSession])

  // 초기 접속 시 익명 상태에서도 위치 감지 & 로그인 시 프로필 업데이트
  useEffect(() => {
    const cachedLocation = sessionStorage.getItem("nomad_location_detected")
    if (!hasDetectedLocation && !cachedLocation) {
        detectAndSetInitialLocation()
    } else if (cachedLocation && !hasDetectedLocation) {
        // 캐시가 있다면 즉시 적용
        applyLocation(cachedLocation)
    }
  }, [hasDetectedLocation])

  const applyLocation = (countryCode: string) => {
    const matchingCity = CITIES.find(c => c.countryCode === countryCode)
    if (matchingCity) {
      setSelectedCity(matchingCity)
    }
    setHasDetectedLocation(true)
  }

  const detectAndSetInitialLocation = async () => {
    let detectedCountry = ""

    try {
      // 1. IP 기반 위치 정보 가져오기 (ipwho.is - 안정적인 무료 서비스)
      const res = await fetch("https://ipwho.is/")
      const data = await res.json()
      
      if (data && data.country_code) {
        detectedCountry = data.country_code
      }
    } catch (error) {
      console.warn("IP-based location failed, trying browser locale fallback...")
      // 2. 백업: 브라우저 언어 설정에서 국가 코드 추출 (예: ko-KR -> KR)
      const locale = navigator.language || (navigator as any).userLanguage
      if (locale && locale.includes("-")) {
        detectedCountry = locale.split("-")[1].toUpperCase()
      }
    }

    if (detectedCountry) {
      sessionStorage.setItem("nomad_location_detected", detectedCountry)
      applyLocation(detectedCountry)

      // 로그인 상태라면 DB 업데이트
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await supabase
          .from("profiles")
          .update({ country_code: detectedCountry })
          .eq("id", session.user.id)
      }
    } else {
      // 모든 방법 실패 시 서울 강제 적용 (더 이상의 에러 방지)
      setHasDetectedLocation(true)
    }
  }

  // 로그인이 감지될 때 다시 한번 위치 업데이트 (세션 보장용)
  const updateUserLocation = async (userId: string) => {
    const cached = sessionStorage.getItem("nomad_location_detected")
    if (cached) {
        await supabase.from("profiles").update({ country_code: cached }).eq("id", userId)
        return
    }
    // 캐시 없을 때만 시도
    detectAndSetInitialLocation()
  }

  const { user } = useAuth()

  // 실시간 메시지 감지를 통한 글로벌 알림 카운트
  useEffect(() => {
    if (!user) return

    const { incrementUnread } = useStore.getState()
    const currentUserId = user.id

    // 1. 시티 채팅 구독 (현재 선택된 도시 위주)
    const cityChannel = supabase.channel('global-chat-tracker')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const { isChatOpen, selectedCity, activeTab } = useStore.getState()
        // 내가 보낸 거 아니고 + (채팅창이 닫혀있거나 OR 다른 탭이거나 OR 다른 도시거나)
        if (payload.new.author_id !== currentUserId) {
           const isVisible = isChatOpen && activeTab === 'city' && selectedCity?.name.toLowerCase() === payload.new.city_id
           if (!isVisible) incrementUnread('city')
        }
      })
      .subscribe()

    // 2. DM/룸 채팅 구독
    const dmChannel = supabase.channel('global-dm-tracker')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages'
      }, (payload) => {
        const { isChatOpen, activeChat, activeTab } = useStore.getState()
        if (payload.new.sender_id !== currentUserId) {
          // DM인 경우
          if (payload.new.receiver_id === currentUserId) {
            const isVisible = isChatOpen && activeTab === 'friends' && activeChat?.type === 'dm' && activeChat?.id === payload.new.sender_id
            if (!isVisible) incrementUnread('dm', payload.new.sender_id)
          } 
          // 룸(그룹/오픈)인 경우
          else if (payload.new.room_id) {
            const isOpenChat = ['global-lounge', 'nomad-tips'].includes(payload.new.room_id)
            const targetTab = isOpenChat ? 'open' : 'friends'
            const isVisible = isChatOpen && activeTab === targetTab && activeChat?.id === payload.new.room_id
            
            if (!isVisible) incrementUnread('room', payload.new.room_id)
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(cityChannel)
      supabase.removeChannel(dmChannel)
    }
  }, [user])

  const isLoginModalOpen = useStore((state) => state.isLoginModalOpen)
  const closeLoginModal = useStore((state) => state.closeLoginModal)

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      <Scene />

      {/* Dashboard Overlay */}
      <DashboardOverlay />

      {/* Community Sidebar */}
      <CommunitySidebar />

      {/* Chat Sidebar */}
      <ChatSidebar />

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={closeLoginModal} 
      />

      {/* Settings Sidebar */}
      <SettingsSidebar />

      {/* Global Toaster */}
      <Toaster position="top-center" richColors />
    </div>
  )
}

export default App
