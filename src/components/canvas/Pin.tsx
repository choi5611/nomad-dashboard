import { useRef, useMemo } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { getPositionFromLatLon } from './math'
import { MapPin } from 'lucide-react'
import * as THREE from 'three'

interface PinProps {
  lat: number
  lng: number
  label: string
  occludeRef?: React.RefObject<THREE.Object3D | null>
  onSelect?: (pos: THREE.Vector3) => void
}

export default function Pin({ lat, lng, label, occludeRef, onSelect }: PinProps) {
  const groupRef = useRef<THREE.Group>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // 지표면에서 약간 띄우기
  const position = getPositionFromLatLon(lat, lng, 5.05)

  // 성능 최적화: 매 프레임마다 객체를 생성하지 않기 위해 벡터 미리 할당
  const vecA = useMemo(() => new THREE.Vector3(), [])
  const vecB = useMemo(() => new THREE.Vector3(), [])
  const vecC = useMemo(() => new THREE.Vector3(), [])

  // 지구 뒤편에 있는 핀을 숨기기 위한 고성능 로직 (State 없이 직접 DOM 조작)
  useFrame(({ camera }) => {
    if (!groupRef.current || !contentRef.current) return

    // 1. 핀의 월드 좌표 가져오기 (vecA 재사용)
    groupRef.current.getWorldPosition(vecA)

    // 2. 카메라에서 핀으로 향하는 벡터 계산 (vecB 재사용)
    vecB.copy(vecA).sub(camera.position).normalize()
    
    // 3. 지구 중심(0,0,0)에서 핀으로 향하는 법선 벡터 (vecC 재사용)
    vecC.copy(vecA).normalize()

    // 4. 내적(Dot Product) 계산
    const dot = vecB.dot(vecC)
    
    // 뒷면 여부 판단 (여유값 -0.15)
    // display: none 대신 visibility: hidden을 사용하여 레이아웃 리플로우(Reflow) 방지
    const isVisible = dot < -0.15
    contentRef.current.style.visibility = isVisible ? 'visible' : 'hidden'
    contentRef.current.style.opacity = isVisible ? '1' : '0'
  })

  const handleClick = () => {
    if (onSelect && groupRef.current) {
      const worldPos = new THREE.Vector3()
      groupRef.current.getWorldPosition(worldPos)
      onSelect(worldPos)
    }
  }
  
  return (
    <group 
      ref={groupRef} 
      position={position} 
      onClick={handleClick} 
      onPointerOver={() => { document.body.style.cursor = 'pointer' }} 
      onPointerOut={() => { document.body.style.cursor = 'auto' }}
    >
      {/* 3D 마커 점 */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0} />
      </mesh>

      {/* HTML 라벨 (occlude 속성은 보조적으로 유지) */}
      <Html 
        distanceFactor={10} 
        occlude={occludeRef ? [occludeRef as React.RefObject<THREE.Object3D>] : true} 
        center 
        style={{ pointerEvents: 'auto' }}
      >
        <div 
          ref={contentRef}
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
          className="flex flex-col items-center cursor-pointer transition-transform hover:scale-110 -translate-y-1/2"
        >
          <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded border border-white/20 text-xs font-bold text-white whitespace-nowrap mb-1 shadow-lg">
            {label}
          </div>
          <MapPin className="w-5 h-5 text-red-500 fill-red-500 animate-bounce" />
        </div>
      </Html>
    </group>
  )
}
