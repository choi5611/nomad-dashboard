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
import { useMediaQuery } from "@/hooks/useMediaQuery"
import MobileNav from "@/components/layout/MobileNav"
import { useInitialLocation } from "@/hooks/useInitialLocation"
import { useRealtimeSync } from "@/hooks/useRealtimeSync"

function App() {
  const setSession = useAuth((state) => state.setSession)
  const { user } = useAuth()
  const isMobile = useMediaQuery("(max-width: 767px)")
  const fetchCities = useStore((state) => state.fetchCities)

  // 1. 초기 도시 데이터 로드
  useEffect(() => {
    fetchCities()
  }, [fetchCities])

  // 2. 초기 위치 감지 및 설정 (Hook)
  useInitialLocation(user)

  // 3. 실시간 동기화 (알림, 채팅 참여 목록) (Hook)
  useRealtimeSync(user)

  // 4. 세션 관리
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
    })

    return () => subscription.unsubscribe()
  }, [setSession])

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
