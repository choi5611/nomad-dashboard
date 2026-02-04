import { useState } from "react"
import { type City } from "@/store/useStore"

export function useGeocoding() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<City[]>([])

  const searchCity = async (query: string) => {
    if (!query || query.length < 2) return []
    
    setLoading(true)
    try {
      // 영어 검색 결과가 가장 정확하므로 en으로 고정
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10&lang=en`)
      const data = await res.json()
      

      const mappedResults: City[] = (data.features || [])
        .map((f: any) => {
          const p = f.properties
          // 이름 구성: "장소명 (국가, 행정구역, 도시 등 가능한 모든 힌트)"
          const hints = [p.city, p.district, p.state, p.country].filter(Boolean)
          const uniqueHints = Array.from(new Set(hints.filter(h => h !== p.name))).slice(0, 2).join(', ')
          const displayName = uniqueHints ? `${p.name} (${uniqueHints})` : p.name

          return {
            name: displayName,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            timezone: "UTC", 
            countryCode: p.countrycode?.toUpperCase() || p.country?.substring(0, 2).toUpperCase() || "UN",
            currencyCode: "USD",
            priority: 3
          }
        })

      setResults(mappedResults)
      return mappedResults
    } catch (error) {
      console.error("Discovery Search failed:", error)
      return []
    } finally {
      setLoading(false)
    }
  }

  return { searchCity, loading, results, setResults }
}
