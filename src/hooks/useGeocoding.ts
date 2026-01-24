import { useState } from "react"
import { type City } from "@/store/useStore"

export function useGeocoding() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<City[]>([])

  const searchCity = async (query: string) => {
    if (!query || query.length < 2) return []
    
    setLoading(true)
    try {
      // Photon API 사용 (OSM 기반, Nominatim보다 브라우저 환경에서 안정적)
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`)
      const data = await res.json()
      console.log("🔍 Photon API Search Data:", data)

      const mappedResults: City[] = (data.features || [])
        .map((f: any) => ({
          name: f.properties.name || f.properties.city || f.properties.state || "Unknown Location",
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          timezone: "UTC", 
          countryCode: f.properties.countrycode?.toUpperCase() || f.properties.country?.substring(0, 2).toUpperCase() || "UN",
          currencyCode: "USD",
          priority: 3
        }))

      console.log("✅ Mapped Results for UI:", mappedResults)
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
