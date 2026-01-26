import { GlassCard, CardHeader, CardTitle, CardContent } from "@/components/dashboard/GlassCard"
import { CloudSun, Loader2 } from "lucide-react"
import { useWeather, getWeatherIcon, getWeatherLabel } from "@/hooks/useWeather"

interface WeatherWidgetProps {
  lat: number
  lng: number
}

export default function WeatherWidget({ lat, lng }: WeatherWidgetProps) {
  const { weather, loading } = useWeather(lat, lng)

  return (
    <GlassCard className="w-64 transition-all hover:bg-white/5">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium text-blue-200 flex items-center gap-2">
          <CloudSun className="w-4 h-4" /> <span>Weather</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {loading || !weather ? (
           <div className="flex items-center gap-2 text-white/50">
             <Loader2 className="w-4 h-4 animate-spin" /> <span>Loading...</span>
           </div>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-4xl drop-shadow-md">{getWeatherIcon(weather.weathercode)}</span>
            <div>
              <div className="text-2xl font-bold"><span>{weather.temperature}°C</span></div>
              <div className="text-xs text-white/60"><span>{getWeatherLabel(weather.weathercode)}</span></div>
            </div>
          </div>
        )}
      </CardContent>
    </GlassCard>
  )
}
