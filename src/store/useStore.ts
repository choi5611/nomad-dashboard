import { create } from 'zustand'

export interface City {
  name: string
  lat: number
  lng: number
  timezone: string // e.g., 'Asia/Seoul'
  countryCode: string // e.g., 'KR'
  currencyCode: string // e.g., 'KRW'
}

interface AppState {
  selectedCity: City | null
  setSelectedCity: (city: City) => void
  isAutoRotating: boolean
  lastInteraction: number
  pauseRotation: () => void
  isSidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void
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
  setSelectedCity: (city) => {
    set({ selectedCity: city, isSidebarOpen: true })
    get().pauseRotation()
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
}))
