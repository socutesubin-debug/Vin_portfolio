import { useEffect, useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { DESK, FINISH } from '../../config/layout'
import { oakTopTexture } from '../textures'

/** 책상: 오크 상판 + 얇은 실버 파이프 다리와 가로대. 원점은 바닥 중앙 */
export default function Desk(props: ThreeElements['group']) {
  const { width, depth, height, top, leg } = DESK
  const map = useMemo(() => oakTopTexture(FINISH.oak), [])
  useEffect(() => () => map.dispose(), [map])

  const legH = height - top
  const lx = width / 2 - 0.05
  const lz = depth / 2 - 0.05
  const railY = legH - 0.035

  return (
    <group {...props}>
      <mesh position={[0, height - top / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, top, depth]} />
        <meshStandardMaterial map={map} roughness={0.55} />
      </mesh>

      {/* 다리 4개 */}
      {[
        [-lx, -lz],
        [lx, -lz],
        [-lx, lz],
        [lx, lz],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, legH / 2, z]} castShadow>
          <cylinderGeometry args={[leg, leg, legH, 16]} />
          <meshStandardMaterial color={FINISH.silver} metalness={1} roughness={0.22} />
        </mesh>
      ))}

      {/* 상판 아래 가로대: 좌우(앞뒤 방향) + 뒤(좌우 방향) */}
      {[-lx, lx].map((x) => (
        <mesh key={x} position={[x, railY, 0]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[leg * 0.8, leg * 0.8, lz * 2, 12]} />
          <meshStandardMaterial color={FINISH.silver} metalness={1} roughness={0.22} />
        </mesh>
      ))}
      <mesh position={[0, railY, -lz]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[leg * 0.8, leg * 0.8, lx * 2, 12]} />
        <meshStandardMaterial color={FINISH.silver} metalness={1} roughness={0.22} />
      </mesh>
    </group>
  )
}
