import { useState, useEffect } from "react"

interface WeatherData {
  temperature: number
  weathercode: number
}

export function useWeather(lat: number, lng: number) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchWeather() {
      setLoading(true)
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
        )
        if (!res.ok) throw new Error(`weather ${res.status}`)
        const data = await res.json()
        setWeather(data.current_weather)
      } catch (error) {
        console.error("Failed to fetch weather", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [lat, lng])

  return { weather, loading }
}

// WMO Weather interpretation codes (Simplified)
export function getWeatherIcon(code: number) {
  if (code === 0) return "☀️" // Clear sky
  if (code >= 1 && code <= 3) return "⛅" // Partly cloudy
  if (code >= 45 && code <= 48) return "🌫️" // Fog
  if (code >= 51 && code <= 67) return "🌧️" // Drizzle / Rain
  if (code >= 71 && code <= 77) return "❄️" // Snow
  if (code >= 95 && code <= 99) return "⛈️" // Thunderstorm
  return "❓"
}

export function getWeatherLabel(code: number) {
  if (code === 0) return "Clear Sky"
  if (code >= 1 && code <= 3) return "Partly Cloudy"
  if (code >= 45 && code <= 48) return "Foggy"
  if (code >= 51 && code <= 67) return "Rainy"
  if (code >= 71 && code <= 77) return "Snowy"
  if (code >= 95 && code <= 99) return "Thunderstorm"
  return "Unknown"
}
