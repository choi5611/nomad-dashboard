import DashboardOverlay from "@/components/dashboard/DashboardOverlay"
import Scene from "@/components/canvas/Scene"

function App() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      <Scene />
      
      {/* Dashboard Overlay */}
      <DashboardOverlay />
    </div>
  )
}

export default App
