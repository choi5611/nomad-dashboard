import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import Pin from "./Pin"
import { GLOBE_RADIUS } from "./math"

interface GlobeProps {
  onSelectPin?: (pos: THREE.Vector3) => void
}

export default function Globe({ onSelectPin }: GlobeProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <group ref={groupRef}>
      {/* 지구본 구체 (와이어프레임) */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial 
          color="#38bdf8" 
          emissive="#0ea5e9"
          emissiveIntensity={0.5}
          wireframe={true} 
          transparent 
          opacity={0.3} 
        />
      </mesh>
      
      {/* 내부 구체 (뒤쪽 별을 가리기 위한 검은 배경) */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS - 0.05, 64, 64]} />
        <meshBasicMaterial color="#020617" /> 
      </mesh>
      
      {/* 위치 핀들 */}
      <Pin lat={37.5665} lng={126.9780} label="Seoul" onSelect={onSelectPin} />
      <Pin lat={40.7128} lng={-74.0060} label="New York" onSelect={onSelectPin} />
      <Pin lat={48.8566} lng={2.3522} label="Paris" onSelect={onSelectPin} />
    </group>
  )
}
