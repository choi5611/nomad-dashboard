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
}

// 초기 기본값: 서울
const INITIAL_CITY: City = {
  name: "Seoul",
  lat: 37.5665,
  lng: 126.9780,
  timezone: "Asia/Seoul",
  countryCode: "KR",
  currencyCode: "KRW"
}

export const useStore = create<AppState>((set) => ({
  selectedCity: INITIAL_CITY,
  setSelectedCity: (city) => set({ selectedCity: city }),
}))
