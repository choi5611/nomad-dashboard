import { useRef } from 'react'
import { Html } from '@react-three/drei'
import { getPositionFromLatLon } from './math'
import { MapPin } from 'lucide-react'
import * as THREE from 'three'

interface PinProps {
  lat: number
  lng: number
  label: string
  onSelect?: (pos: THREE.Vector3) => void
}

export default function Pin({ lat, lng, label, onSelect }: PinProps) {
  const groupRef = useRef<THREE.Group>(null)
  const position = getPositionFromLatLon(lat, lng)

  const handleClick = () => {
    if (onSelect && groupRef.current) {
      // 월드 좌표로 변환해서 전달
      const worldPos = new THREE.Vector3()
      groupRef.current.getWorldPosition(worldPos)
      onSelect(worldPos)
    }
  }
  
  return (
    <group ref={groupRef} position={position} onClick={handleClick} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
      {/* 3D 마커 점 (투명한 클릭 영역으로 사용) */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} /> {/* 클릭 영역 약간 확대 */}
        <meshBasicMaterial color="#ef4444" transparent opacity={0} />
      </mesh>

      {/* HTML 라벨 (거리 원근감 적용) */}
      <Html distanceFactor={10} occlude center style={{ pointerEvents: 'auto' }}> {/* pointerEvents: auto so we can click the HTML */}
        <div 
          onClick={(e) => {
            e.stopPropagation() // Prevent click from bubbling to the canvas/mesh if unnecessary
            handleClick()
          }}
          className="flex flex-col items-center cursor-pointer transition-transform hover:scale-110 -translate-y-1/2" // Adjust offset for centered HTML
        >
          <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded border border-white/20 text-xs font-bold text-white whitespace-nowrap mb-1">
            {label}
          </div>
          <MapPin className="w-5 h-5 text-red-500 fill-red-500 animate-bounce" />
          {/* 바닥 꼭지점을 맞추기 위한 미세 조정이 필요할 수 있음 */}
        </div>
      </Html>
    </group>
  )
}
