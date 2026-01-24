import { useRef, useState, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import * as THREE from "three"
import Pin from "./Pin"
import { GLOBE_RADIUS } from "./math"
import { useStore, type City } from "@/store/useStore"
import { CITIES } from "@/data/cities"

// 국가 코드 -> 한글 국가명 매핑 (주요 국가만 예시로)
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
  const isAutoRotating = useStore((state) => state.isAutoRotating)
  const [cameraDistance, setCameraDistance] = useState(20)

  // 텍스처 로드
  const [colorMap, normalMap, specularMap] = useTexture([
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'
  ])

  // 현재 줌 레벨에 따라 보여줄 핀 필터링
  const visibleCities = useMemo(() => {
    if (cameraDistance > 25) {
      // 아주 멀리 있을 때: 국가 대표 도시(Priority 1)만 표시
      return CITIES.filter(c => (c.priority || 3) === 1)
    } else if (cameraDistance > 15) {
      // 중간 거리: 주요 도시(Priority 1, 2) 표시
      return CITIES.filter(c => (c.priority || 3) <= 2)
    }
    // 가까이 있을 때: 모든 핀 표시
    return CITIES
  }, [cameraDistance])

  useFrame(({ camera }, delta) => {
    // 자동 회전
    if (groupRef.current && isAutoRotating) {
      groupRef.current.rotation.y += delta * 0.05
    }

    // 카메라 거리 감지 (LOD 최적화)
    // 매 프레임 state를 바꾸지 않고, 임계값을 넘었을 때만 업데이트하여 핀 리렌더링 최소화
    const dist = camera.position.length()
    const getRange = (d: number) => {
      if (d > 25) return 30 // Far
      if (d > 15) return 20 // Mid
      return 10 // Close
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
      {/* 1. 지구본 본체 (텍스처 적용) - 텍스처 정렬을 위해 Y축 회전 */}
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
