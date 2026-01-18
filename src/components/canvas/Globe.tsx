import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import * as THREE from "three"
import Pin from "./Pin"
import { GLOBE_RADIUS } from "./math"
import { useStore, type City } from "@/store/useStore"

interface GlobeProps {
  onSelectPin?: (pos: THREE.Vector3) => void
}

// 도시 데이터 리스트
const CITIES: City[] = [
  { name: "Seoul", lat: 37.5665, lng: 126.9780, timezone: "Asia/Seoul", countryCode: "KR", currencyCode: "KRW" },
  { name: "New York", lat: 40.7128, lng: -74.0060, timezone: "America/New_York", countryCode: "US", currencyCode: "USD" },
  { name: "Paris", lat: 48.8566, lng: 2.3522, timezone: "Europe/Paris", countryCode: "FR", currencyCode: "EUR" },
  { name: "London", lat: 51.5074, lng: -0.1278, timezone: "Europe/London", countryCode: "GB", currencyCode: "GBP" },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503, timezone: "Asia/Tokyo", countryCode: "JP", currencyCode: "JPY" },
]

export default function Globe({ onSelectPin }: GlobeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const setSelectedCity = useStore((state) => state.setSelectedCity)

  // 텍스처 로드 (Three.js 예제 텍스처 사용)
  const [colorMap, normalMap, specularMap] = useTexture([
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'
  ])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05
    }
  })

  const handlePinClick = (city: City, pos: THREE.Vector3) => {
    setSelectedCity(city)
    if (onSelectPin) onSelectPin(pos)
  }

  return (
    <group ref={groupRef}>
      {/* 1. 지구본 본체 (텍스처 적용) */}
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
