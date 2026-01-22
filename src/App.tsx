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

function App() {
  const setSession = useAuth((state) => state.setSession)

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

  // 접속 IP 기반 국가 자동 업데이트 및 초기 도시 설정
  const updateUserLocation = async (userId: string) => {
    try {
      const res = await fetch("https://ipapi.co/json/")
      const data = await res.json()
      
      if (data.country_code) {
        // 1. 프로필 업데이트
        await supabase
          .from("profiles")
          .update({ country_code: data.country_code })
          .eq("id", userId)

        // 2. 현재 국가에 맞춰 초기 도시 설정 (서울 기본값 탈출)
        // 한국이면 서울, 태국이면 방콕 등으로 매핑 (예시 도시들)
        const countryToCity: Record<string, string> = {
          "KR": "Seoul",
          "TH": "Bangkok",
          "JP": "Tokyo",
          "US": "New York",
          "VN": "Ho Chi Minh City",
          "DE": "Berlin",
          "FR": "Paris"
        }

        const cityName = countryToCity[data.country_code]
        if (cityName) {
             // 해당 도시의 좌표를 store에서 찾아 선택하는 로직이 필요하지만, 
             // 여기서는 임시로 로그만 남기고 실제 구현은 store 데이터를 활용해야 함
             console.log(`Detected Location: ${cityName} (${data.country_code})`)
        }
      }
    } catch (error) {
      console.error("Location detection failed:", error)
    }
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
