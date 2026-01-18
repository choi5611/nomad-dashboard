import * as THREE from 'three'

export const GLOBE_RADIUS = 5

/**
 * 위도(Latitude)와 경도(Longitude)를 3D Vector3 좌표로 변환합니다.
 *
 * 공식 출처: https://gist.github.com/nicoptere/2f2571db4b454bb18cd9
 * Three.js earth 텍스처와 호환되는 표준 공식
 */
export function getPositionFromLatLon(lat: number, lng: number, radius = GLOBE_RADIUS) {
  // 도(degree)를 라디안(radian)으로 변환
  const phi = lat * (Math.PI / 180)
  const theta = (lng - 180) * (Math.PI / 180)

  // 표준 구면좌표 -> 직교좌표 변환
  // x를 음수로 하여 텍스처 방향 맞춤
  const x = -radius * Math.cos(phi) * Math.cos(theta)
  const y = radius * Math.sin(phi)
  const z = radius * Math.cos(phi) * Math.sin(theta)

  return new THREE.Vector3(x, y, z)
}
