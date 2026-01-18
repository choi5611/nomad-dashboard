import DashboardOverlay from "@/components/dashboard/DashboardOverlay"
import Scene from "@/components/canvas/Scene"
import CommunitySidebar from "@/components/community/CommunitySidebar"

function App() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      <Scene />

      {/* Dashboard Overlay */}
      <DashboardOverlay />

      {/* Community Sidebar */}
      <CommunitySidebar />
    </div>
  )
}

export default App
