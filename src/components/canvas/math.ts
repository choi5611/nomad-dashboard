import * as THREE from 'three'

export const GLOBE_RADIUS = 5

/**
 * 위도(Latitude)와 경도(Longitude)를 3D Vector3 좌표로 변환합니다.
 * @param lat 위도 (도 단위)
 * @param lng 경도 (도 단위)
 * @param radius 구의 반지름 (기본값: GLOBE_RADIUS)
 */
export function getPositionFromLatLon(lat: number, lng: number, radius = GLOBE_RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)

  return new THREE.Vector3(x, y, z)
}
