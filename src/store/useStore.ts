import { create } from 'zustand'

export interface City {
  name: string
  lat: number
  lng: number
  timezone: string // e.g., 'Asia/Seoul'
  countryCode: string // e.g., 'KR'
  currencyCode: string // e.g., 'KRW'
  priority?: number // 1: Country Representative, 2: Major City, 3: Spot
}

interface AppState {
  selectedCity: City | null
  setSelectedCity: (city: City, shouldPause?: boolean) => void
  isAutoRotating: boolean
  lastInteraction: number
  pauseRotation: () => void
  isSidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void
  isLoginModalOpen: boolean
  openLoginModal: () => void
  closeLoginModal: () => void
  isSettingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
  isChatOpen: boolean
  toggleChat: () => void
  closeChat: () => void
  activeChat: { type: 'dm' | 'group' | 'open', id: string, name: string, avatar_url?: string } | null
  setActiveChat: (chat: { type: 'dm' | 'group' | 'open', id: string, name: string, avatar_url?: string } | null) => void
  unreadState: {
    city: number,
    dms: Record<string, number>,
    rooms: Record<string, number>
  }
  incrementUnread: (type: 'city' | 'dm' | 'room', id?: string) => void
  resetUnread: (type: 'city' | 'dm' | 'room', id?: string) => void
  activeTab: 'city' | 'friends' | 'open'
  setActiveTab: (tab: 'city' | 'friends' | 'open') => void
  // 모바일 전용 뷰 관리
  setActiveView: (view: 'globe' | 'community' | 'chat' | 'settings') => void
}

const AUTO_ROTATE_DELAY = 5000 // 5초 후 다시 회전

// 초기 기본값: 서울
const INITIAL_CITY: City = {
  name: "Seoul",
  lat: 37.5665,
  lng: 126.9780,
  timezone: "Asia/Seoul",
  countryCode: "KR",
  currencyCode: "KRW"
}

export const useStore = create<AppState>((set, get) => ({
  selectedCity: INITIAL_CITY,
  setSelectedCity: (city, shouldPause = true) => {
    set({ selectedCity: city, isSidebarOpen: true })
    if (shouldPause) {
      get().pauseRotation()
    }
  },
  isAutoRotating: true,
  lastInteraction: 0,
  pauseRotation: () => {
    set({ isAutoRotating: false, lastInteraction: Date.now() })
    setTimeout(() => {
      const { lastInteraction } = get()
      if (Date.now() - lastInteraction >= AUTO_ROTATE_DELAY - 100) {
        set({ isAutoRotating: true })
      }
    }, AUTO_ROTATE_DELAY)
  },
  isSidebarOpen: false,
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  isLoginModalOpen: false,
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
  isSettingsOpen: false,
  openSettings: () => set({ isSettingsOpen: true, isSidebarOpen: false }), // 설정 열 때 커뮤니티 사이드바는 닫음
  closeSettings: () => set({ isSettingsOpen: false }),
  isChatOpen: false,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  closeChat: () => set({ isChatOpen: false }),
  activeChat: null,
  setActiveChat: (chat) => set({ activeChat: chat }),
  unreadState: { city: 0, dms: {}, rooms: {} },
  incrementUnread: (type, id) => set((state) => {
    const newState = { ...state.unreadState }
    if (type === 'city') {
      newState.city = Math.min(99, newState.city + 1)
    } else if (type === 'dm' && id) {
      newState.dms = { ...newState.dms, [id]: Math.min(99, (newState.dms[id] || 0) + 1) }
    } else if (type === 'room' && id) {
      newState.rooms = { ...newState.rooms, [id]: Math.min(99, (newState.rooms[id] || 0) + 1) }
    }
    return { unreadState: newState }
  }),
  resetUnread: (type, id) => set((state) => {
    const newState = { ...state.unreadState }
    if (type === 'city') {
      newState.city = 0
    } else if (type === 'dm' && id) {
      newState.dms = { ...newState.dms, [id]: 0 }
    } else if (type === 'room' && id) {
      newState.rooms = { ...newState.rooms, [id]: 0 }
    } else if (type === 'dm') { // 전체 초기화 (탭 클릭 시 등)
      newState.dms = {}
    } else if (type === 'room') {
      newState.rooms = {}
    }
    return { unreadState: newState }
  }),
  activeTab: 'city',
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveView: (view) => set({
    isSidebarOpen: view === 'community',
    isChatOpen: view === 'chat',
    isSettingsOpen: view === 'settings',
  }),
}))
