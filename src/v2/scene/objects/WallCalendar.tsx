import { useEffect, useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { calendarTexture } from '../textures'

const SIZE = { w: 0.46, h: 0.62 }

/**
 * 뒷벽 오른쪽의 큰 종이 달력(이번 달, 오늘 날짜 동그라미). 벽 장식은 이것 하나.
 * 작은 소품이라 그림자는 받기만 한다. 원점은 달력 가운데, 앞면이 +z.
 */
export default function WallCalendar(props: ThreeElements['group']) {
  const map = useMemo(() => calendarTexture(), [])
  useEffect(() => () => map.dispose(), [map])
  return (
    <group {...props}>
      {/* 종이(살짝 두께) */}
      <mesh receiveShadow>
        <boxGeometry args={[SIZE.w, SIZE.h, 0.004]} />
        <meshStandardMaterial color="#fbfaf6" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.0025]} receiveShadow>
        <planeGeometry args={[SIZE.w, SIZE.h]} />
        <meshStandardMaterial map={map} roughness={0.9} />
      </mesh>
      {/* 위쪽 철제 바인딩 + 걸이 못 */}
      <mesh position={[0, SIZE.h / 2 - 0.012, 0.006]}>
        <boxGeometry args={[SIZE.w * 0.96, 0.014, 0.006]} />
        <meshStandardMaterial color="#3a3c40" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, SIZE.h / 2 + 0.03, 0.004]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.004, 0.004, 0.012, 10]} />
        <meshStandardMaterial color="#3a3c40" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}
