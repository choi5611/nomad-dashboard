import { useRef, useState, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import * as THREE from "three"
import Pin from "./Pin"
import { GLOBE_RADIUS } from "./math"
import { useStore, type City } from "@/store/useStore"

// 국가 코드 -> 한글 국가명 매핑
const COUNTRY_NAMES: Record<string, string> = {
  KR: "SOUTH KOREA",
  JP: "JAPAN",
  TH: "THAILAND",
  ID: "INDONESIA",
  SG: "SINGAPORE",
  VN: "VIETNAM",
  MY: "MALAYSIA",
  TW: "TAIWAN",
  HK: "HONG KONG",
  CN: "CHINA",
  IN: "INDIA",
  PH: "PHILIPPINES",
  KZ: "KAZAKHSTAN",
  RU: "RUSSIA",
  GB: "UNITED KINGDOM",
  FR: "FRANCE",
  PT: "PORTUGAL",
  ES: "SPAIN",
  IT: "ITALY",
  DE: "GERMANY",
  NL: "NETHERLANDS",
  CZ: "CZECH REPUBLIC",
  AT: "AUSTRIA",
  CH: "SWITZERLAND",
  SE: "SWEDEN",
  IS: "ICELAND",
  GR: "GREECE",
  US: "USA",
  CA: "CANADA",
  MX: "MEXICO",
  BR: "BRAZIL",
  AR: "ARGENTINA",
  CL: "CHILE",
  PE: "PERU",
  CO: "COLOMBIA",
  AE: "UAE",
  SA: "SAUDI ARABIA",
  IL: "ISRAEL",
  TR: "TURKEY",
  EG: "EGYPT",
  ZA: "SOUTH AFRICA",
  KE: "KENYA",
  MA: "MOROCCO",
  AU: "AUSTRALIA",
  NZ: "NEW ZEALAND",
  MV: "MALDIVES"
}

interface GlobeProps {
  onSelectPin?: (pos: THREE.Vector3) => void
}

export default function Globe({ onSelectPin }: GlobeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const setSelectedCity = useStore((state) => state.setSelectedCity)
  const cities = useStore((state) => state.cities)
  const [cameraDistance, setCameraDistance] = useState(20)

  // 텍스처 로드
  const [colorMap, normalMap, specularMap] = useTexture([
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'
  ])

  // 현재 줌 레벨에 따라 보여줄 핀 필터링
  const visibleCities = useMemo(() => {
    // 줌 거리에 상관없이 '스팟(priority 3)' 단위의 작은 도시는 핀을 표시하지 않음
    // 사용자 요청: 작은 도시들이 너무 많아지는 것을 방지하고 검색을 통해서만 진입하게 함
    if (cameraDistance > 25) {
      return cities.filter(c => (c.priority || 3) === 1)
    }
    // 최대 줌에서도 priority 2(주요 도시)까지만 표시
    return cities.filter(c => (c.priority || 3) <= 2)
  }, [cameraDistance, cities])

  useFrame(({ camera }) => {
    // 자동 회전은 이제 Scene.tsx의 CameraControls가 담당합니다.
    // 여기서는 LOD(거리별 핀 표시)만 계산합니다.

    const dist = camera.position.length()
    const getRange = (d: number) => {
      if (d > 25) return 30 
      if (d > 15) return 20 
      return 10 
    }

    const currentRange = getRange(dist)
    const prevRange = getRange(cameraDistance)

    if (currentRange !== prevRange) {
      setCameraDistance(dist)
    }
  })

  const globeRef = useRef<THREE.Object3D>(null)

  const handlePinClick = (city: City, pos: THREE.Vector3) => {
    setSelectedCity(city)
    if (onSelectPin) onSelectPin(pos)
  }

  return (
    <group ref={groupRef}>
      {/* 1. 지구본 본체 */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          specularMap={specularMap}
          specular={new THREE.Color(0x333333)}
          shininess={5}
        />
      </mesh>

      {/* 2. 디지털 그리드 */}
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
      
      {/* 3. 대기 효과 */}
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

      {/* 디버그용 중심점 (정확히 아프리카 좌측 하단 기니만 부근이어야 함) */}
      <Pin 
        lat={0} 
        lng={0} 
        label="EQUATOR/MERIDIAN" 
        onSelect={() => {}}
      />
      
      {/* 위치 핀들 */}
      {visibleCities.map((city) => (
        <Pin 
          key={city.name}
          lat={city.lat} 
          lng={city.lng} 
          label={cameraDistance > 25 ? (COUNTRY_NAMES[city.countryCode] || city.name) : city.name} 
          occludeRef={globeRef}
          onSelect={(pos) => handlePinClick(city, pos)} 
        />
      ))}


    </group>
  )
}
