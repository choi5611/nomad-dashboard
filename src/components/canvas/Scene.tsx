import { Canvas } from "@react-three/fiber"
import { CameraControls, Stars } from "@react-three/drei"
import { Suspense, useRef } from "react"
import Globe from "./Globe"
import * as THREE from "three"

function SceneContent() {
  const cameraControlsRef = useRef<CameraControls>(null)

  const handleSelectPin = (position: THREE.Vector3) => {
    // 핀 위치 방향으로 카메라 이동 (지구본 중심을 바라봄)
    // 현재 지구 반지름이 5이므로, 거리를 12 정도로 잡음
    const distance = 12
    const camPos = position.clone().normalize().multiplyScalar(distance)
    
    cameraControlsRef.current?.setLookAt(
      camPos.x, camPos.y, camPos.z, // 카메라 위치
      0, 0, 0, // 바라보는 지점 (지구 중심)
      true // 부드러운 전환 활성화
    )
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Globe onSelectPin={handleSelectPin} />
      <CameraControls ref={cameraControlsRef} minDistance={8} maxDistance={50} />
    </>
  )
}

export default function Scene() {
  return (
    <div className="absolute inset-0 z-0 bg-black">
      <Canvas camera={{ position: [0, 0, 20], fov: 45 }}>
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  )
}
