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
  activityCount?: number
  occludeRef?: React.RefObject<THREE.Object3D | null>
  onSelect?: (pos: THREE.Vector3) => void
}

export default function Pin({ lat, lng, label, activityCount = 0, occludeRef, onSelect }: PinProps) {
  const groupRef = useRef<THREE.Group>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  
  // 지표면에서 약간 띄우기
  const position = getPositionFromLatLon(lat, lng, 5.05)

  // 성능 최적화: 매 프레임마다 객체를 생성하지 않기 위해 벡터 미리 할당
  const vecA = useMemo(() => new THREE.Vector3(), [])
  const vecB = useMemo(() => new THREE.Vector3(), [])
  const vecC = useMemo(() => new THREE.Vector3(), [])

  // 렌더링 루프 (가시성 및 애니메이션 제어)
  useFrame(({ camera, clock }) => {
    if (!groupRef.current || !contentRef.current) return

    // 1. 핀의 월드 좌표 가져오기
    groupRef.current.getWorldPosition(vecA)

    // 2. 카메라에서 핀으로 향하는 벡터 계산 (지구 뒤편 숨기기 로직)
    vecB.copy(vecA).sub(camera.position).normalize()
    vecC.copy(vecA).normalize()
    const dot = vecB.dot(vecC)
    
    const isVisible = dot < -0.15
    contentRef.current.style.visibility = isVisible ? 'visible' : 'hidden'
    contentRef.current.style.opacity = isVisible ? '1' : '0'

    // 3. 활동량에 따른 글로우 맥동 애니메이션 (Glow Pulsing)
    if (glowRef.current && activityCount > 0) {
      const time = clock.getElapsedTime()
      const pulse = 1 + Math.sin(time * 4) * 0.15
      const intensity = Math.min(activityCount / 8, 1.5)
      // 입체적인 구체 스케일 조절
      glowRef.current.scale.setScalar(pulse * (0.8 + intensity))
      glowRef.current.visible = isVisible
      if (glowRef.current.material instanceof THREE.MeshBasicMaterial) {
        // 투명도도 함께 맥동하여 부드러운 빛 효과 연출
        glowRef.current.material.opacity = (0.25 + Math.sin(time * 4) * 0.1) * (isVisible ? 1 : 0)
      }
    }
  })

  const handleClick = () => {
    if (onSelect && groupRef.current) {
      const worldPos = new THREE.Vector3()
      groupRef.current.getWorldPosition(worldPos)
      onSelect(worldPos)
    }
  }
  
  const pinColor = activityCount > 0 ? `#22d3ee` : "#ef4444" 

  return (
    <group ref={groupRef} position={position} onClick={handleClick}>
      {/* 1. 활동 히트맵 글로우 (구체 형태로 변경하여 지표면 클리핑 방지) */}
      {activityCount > 0 && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshBasicMaterial 
            color="#22d3ee" 
            transparent 
            opacity={0.3} 
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 2. 3D 마커 본체 (레이캐스팅/위치 확인용, 시각적으로는 숨김) */}
      <mesh>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={pinColor} transparent opacity={0} />
      </mesh>

      {/* 3. HTML 라벨 & 아이콘 */}
      <Html 
        distanceFactor={8} 
        occlude={occludeRef ? [occludeRef as React.RefObject<THREE.Object3D>] : true} 
        center 
        style={{ pointerEvents: 'none' }}
      >
        <div 
          ref={contentRef}
          className="flex flex-col items-center select-none -translate-y-[55%]"
        >
          {/* 타이틀 뱃지 디자인 고도화 */}
          <div className={`px-2 py-0.5 rounded-full backdrop-blur-md border shadow-lg transition-all duration-300 ${
            activityCount > 0 
              ? 'bg-cyan-500/30 border-cyan-400/50 shadow-cyan-500/20 scale-105' 
              : 'bg-slate-900/80 border-white/10'
          }`}>
             <span className="text-[10px] font-bold text-white whitespace-nowrap flex items-center gap-1">
               {label}
               {activityCount > 5 && <span className="text-xs">🔥</span>}
             </span>
          </div>
          
          {/* 위치 핀 아이콘 (발광 효과 추가) */}
          <div className="mt-0.5 relative flex items-center justify-center">
            {activityCount > 0 && (
              <div className="absolute w-4 h-4 bg-cyan-400 rounded-full blur-md animate-pulse opacity-60" />
            )}
            <MapPin 
              className={`w-3.5 h-3.5 ${
                activityCount > 0 ? 'text-cyan-300 fill-cyan-300' : 'text-red-500 fill-red-500'
              }`} 
              style={{ filter: activityCount > 0 ? 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.8))' : 'none' }}
            />
          </div>
        </div>
      </Html>

      {/* 클릭 판정용 히트박스 */}
      <mesh 
        visible={false} 
        onPointerOver={() => { document.body.style.cursor = 'pointer' }} 
        onPointerOut={() => { document.body.style.cursor = 'auto' }}
      >
        <sphereGeometry args={[0.3, 16, 16]} />
      </mesh>
    </group>
  );
}
