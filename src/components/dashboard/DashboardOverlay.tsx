import ClockWidget from "./ClockWidget"
import ExchangeRateWidget from "./ExchangeRateWidget"
import WeatherWidget from "./WeatherWidget"
import { useStore } from "@/store/useStore"

export default function DashboardOverlay() {
  const selectedCity = useStore((state) => state.selectedCity)
  return (
    <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
      {/* Top Bar: Header & Status */}
      <header className="flex justify-between items-start">
        <div className="pointer-events-auto">
           <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-sm">
            {selectedCity ? selectedCity.name : "Nomad OS"}
          </h1>
          <p className="text-blue-200/80 text-sm mt-1">
            {selectedCity ? `Global Command Center • ${selectedCity.countryCode}` : "Select a city to begin"}
          </p>
        </div>

        {/* Top Right Widget Area */}
        <div className="flex gap-4 pointer-events-auto">
          {selectedCity && <ClockWidget timezone={selectedCity.timezone} />}
        </div>
      </header>

      {/* Bottom Widgets */}
      <footer className="flex gap-4 items-end pointer-events-auto">
        {selectedCity && <WeatherWidget lat={selectedCity.lat} lng={selectedCity.lng} />}
        {selectedCity && <ExchangeRateWidget targetCurrency={selectedCity.currencyCode} />}
      </footer>
    </div>
  )
}
