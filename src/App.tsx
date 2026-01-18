import { Button } from "@/components/ui/button"
import Scene from "@/components/canvas/Scene"

function App() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      <Scene />
      
      {/* Foreground UI */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-center space-y-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
            Nomad Dashboard
          </h1>
          <Button variant="outline" className="backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20">
            Enter the World
          </Button>
        </div>
      </div>
    </div>
  )
}

export default App
