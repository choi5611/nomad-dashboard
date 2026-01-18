import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import * as THREE from "three"
import Pin from "./Pin"
import { GLOBE_RADIUS } from "./math"
import { useStore, type City } from "@/store/useStore"
import { CITIES } from "@/data/cities"

interface GlobeProps {
  onSelectPin?: (pos: THREE.Vector3) => void
}

export default function Globe({ onSelectPin }: GlobeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const setSelectedCity = useStore((state) => state.setSelectedCity)
  const isAutoRotating = useStore((state) => state.isAutoRotating)

  // 텍스처 로드 (Three.js 예제 텍스처 사용)
  const [colorMap, normalMap, specularMap] = useTexture([
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'
  ])

  useFrame((_, delta) => {
    if (groupRef.current && isAutoRotating) {
      groupRef.current.rotation.y += delta * 0.05
    }
  })

  const handlePinClick = (city: City, pos: THREE.Vector3) => {
    setSelectedCity(city)
    if (onSelectPin) onSelectPin(pos)
  }

  return (
    <group ref={groupRef}>
      {/* 1. 지구본 본체 (텍스처 적용) - 텍스처 정렬을 위해 Y축 회전 */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          specularMap={specularMap}
          specular={new THREE.Color(0x333333)}
          shininess={5}
        />
      </mesh>

      {/* 2. 디지털 그리드/와이어프레임 오버레이 (약간 더 크게) */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS + 0.02, 64, 64]} />
        <meshStandardMaterial 
          color="#38bdf8" 
          emissive="#0ea5e9"
          emissiveIntensity={0.2}
          wireframe={true} 
          transparent 
          opacity={0.15} 
        />
      </mesh>
      
      {/* 3. 대기 효과 (Atmosphere Glow) - 선택 사항 */}
      <mesh>
         <sphereGeometry args={[GLOBE_RADIUS + 0.2, 64, 64]} />
         <meshBasicMaterial 
            color="#3b82f6" 
            transparent 
            opacity={0.05} 
            side={THREE.BackSide} 
            blending={THREE.AdditiveBlending}
         />
      </mesh>
      
      {/* 위치 핀들 */}
      {CITIES.map((city) => (
        <Pin 
          key={city.name}
          lat={city.lat} 
          lng={city.lng} 
          label={city.name} 
          onSelect={(pos) => handlePinClick(city, pos)} 
        />
      ))}
    </group>
  )
}
