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
import { ErrorBoundary } from "@/components/common/ErrorBoundary"

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
    // 초기 세션은 onAuthStateChange의 INITIAL_SESSION 이벤트로 받는다.
    // (getSession()을 따로 부르면 인증 락을 한 번 더 기다리고, 느린 기기에서 락 대기가 10초를 넘으면
    //  잡히지 않은 AbortError가 됐음)
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
      {/* 지구본(WebGL·텍스처) 오류가 피드·채팅까지 앱 전체를 내리지 않도록 따로 감쌈 */}
      <ErrorBoundary fallback={<div className="absolute inset-0 bg-black" />}>
        <Scene />
      </ErrorBoundary>
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
