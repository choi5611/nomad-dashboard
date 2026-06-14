import { Canvas, useFrame } from "@react-three/fiber"
import { CameraControls, Stars } from "@react-three/drei"
import { Suspense, useRef, useEffect } from "react"
import Globe from "./Globe"
import * as THREE from "three"
import { useStore } from "@/store/useStore"
import { getPositionFromLatLon } from "./math"
import { useMediaQuery } from "@/hooks/useMediaQuery"

function SceneContent() {
  const cameraControlsRef = useRef<CameraControls>(null)
  const isAutoRotating = useStore((state) => state.isAutoRotating)
  const pauseRotation = useStore((state) => state.pauseRotation)
  const isSidebarOpen = useStore((state) => state.isSidebarOpen)
  const isChatOpen = useStore((state) => state.isChatOpen)
  const selectedCity = useStore((state) => state.selectedCity)
  const isMobile = useMediaQuery("(max-width: 767px)")

  // 1. 자동 회전 (카메라가 지구 주위를 공전)
  useFrame((_, delta) => {
    if (isAutoRotating && cameraControlsRef.current) {
      cameraControlsRef.current.azimuthAngle += 0.05 * delta
    }
  })

  // 2. 도시 선택 시 카메라 이동 + 뷰 오프셋(사이드바 피하기)
  useEffect(() => {
    if (!cameraControlsRef.current) return

    // 기본 카메라 위치 (지구로부터 거리 12)
    const distance = 12
    let targetX = 0
    const targetY = 0
    const targetZ = 0

    if (selectedCity) {
      const pos = getPositionFromLatLon(selectedCity.lat, selectedCity.lng)
      const camPos = pos.clone().normalize().multiplyScalar(distance)
      
      // 데스크탑에서 사이드바가 열려 있으면 타겟을 왼쪽으로 살짝 밀어줌 (View Offset)
      // 384px(사이드바 너비)은 대략 지구본 중심에서 1.5~2.0 유닛 정도 이동하는 것과 비슷함
      if (!isMobile && (isSidebarOpen || isChatOpen)) {
        targetX = -1.2 
      }

      cameraControlsRef.current.setLookAt(
        camPos.x, camPos.y, camPos.z, // 카메라 위치
        targetX, targetY, targetZ,   // 바라보는 지점 (약간 왼쪽)
        true                         // 부드러운 전환
      )

      // 포커싱 후 잠시 멈춤
      pauseRotation()
    }
  }, [selectedCity, isSidebarOpen, isChatOpen, isMobile, pauseRotation])

  // 3. 사용자 조작 감지 (조작 시 자동 회전 일시정지)
  useEffect(() => {
    const controls = cameraControlsRef.current
    if (!controls) return

    let isInteracting = false
    const onSelectStart = () => { isInteracting = true }
    const onSelectEnd = () => { isInteracting = false }

    const handleControlStart = () => {
      if (isInteracting) pauseRotation()
    }

    window.addEventListener('mousedown', onSelectStart)
    window.addEventListener('mouseup', onSelectEnd)
    window.addEventListener('touchstart', onSelectStart)
    window.addEventListener('touchend', onSelectEnd)
    controls.addEventListener('controlstart', handleControlStart)

    return () => {
      window.removeEventListener('mousedown', onSelectStart)
      window.removeEventListener('mouseup', onSelectEnd)
      window.removeEventListener('touchstart', onSelectStart)
      window.removeEventListener('touchend', onSelectEnd)
      controls.removeEventListener('controlstart', handleControlStart)
    }
  }, [pauseRotation])

  const handleSelectPin = (position: THREE.Vector3) => {
    const distance = 12
    const camPos = position.clone().normalize().multiplyScalar(distance)
    cameraControlsRef.current?.setLookAt(camPos.x, camPos.y, camPos.z, 0, 0, 0, true)
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
