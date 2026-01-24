import * as THREE from 'three'

export const GLOBE_RADIUS = 5

/**
 * 위도(Latitude)와 경도(Longitude)를 3D Vector3 좌표로 변환합니다.
 *
 * 공식 출처: https://gist.github.com/nicoptere/2f2571db4b454bb18cd9
 * Three.js earth 텍스처와 호환되는 표준 공식
 */
export function getPositionFromLatLon(lat: number, lng: number, radius = GLOBE_RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 90) * (Math.PI / 180)

  const x = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.cos(theta)

  return new THREE.Vector3(x, y, z)
}
