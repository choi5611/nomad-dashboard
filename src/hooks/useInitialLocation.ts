import { useState, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useStore } from "@/store/useStore"

export function useInitialLocation(user: any) {
  const [hasDetectedLocation, setHasDetectedLocation] = useState(false)
  const setSelectedCity = useStore((state) => state.setSelectedCity)
  const cities = useStore((state) => state.cities)

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
      const res = await fetch("https://ipapi.co/json/")
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

  // 초기 실행 로직
  useEffect(() => {
    const cachedLocation = sessionStorage.getItem("nomad_location_detected")
    if (!hasDetectedLocation) {
        if (!cachedLocation) {
          detectAndSetInitialLocation()
        } else {
          applyLocation(cachedLocation)
        }
    }
  }, [hasDetectedLocation, detectAndSetInitialLocation, applyLocation])

  // 유저 로그인 시 위치 업데이트
  useEffect(() => {
    if (user) {
      updateUserLocation(user.id)
    }
  }, [user, updateUserLocation])

  return { hasDetectedLocation }
}
