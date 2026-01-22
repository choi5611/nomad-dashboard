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
