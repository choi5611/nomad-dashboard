import { useState } from "react"
import { type City } from "@/store/useStore"

export function useGeocoding() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<City[]>([])

  const searchCity = async (query: string) => {
    if (!query || query.length < 2) return []
    
    setLoading(true)
    try {
      // Nominatim API 사용 (오픈소스 지오코딩)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`)
      const data = await res.json()

      const mappedResults: City[] = data
        .filter((item: any) => item.type === 'city' || item.type === 'town' || item.type === 'administrative')
        .map((item: any) => ({
          name: item.display_name.split(',')[0],
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          timezone: "UTC", // 기본값 (나중에 보정 가능)
          countryCode: item.address?.country_code?.toUpperCase() || "UN",
          currencyCode: "USD", // 기본값
          priority: 3
        }))

      setResults(mappedResults)
      return mappedResults
    } catch (error) {
      console.error("Geocoding failed:", error)
      return []
    } finally {
      setLoading(false)
    }
  }

  return { searchCity, loading, results, setResults }
}
