import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stars } from "@react-three/drei"
import { Suspense } from "react"
import Globe from "./Globe"

export default function Scene() {
  return (
    <div className="absolute inset-0 z-0 bg-black">
      <Canvas camera={{ position: [0, 0, 20], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Globe />
          <OrbitControls enableZoom={true} enablePan={false} minDistance={10} maxDistance={50} />
        </Suspense>
      </Canvas>
    </div>
  )
}
