import type { ThreeElements } from '@react-three/fiber'
import { DESK } from '../../config/layout'

/** 책상: 상판 + 다리 4개. 원점은 바닥 중앙 */
export default function Desk(props: ThreeElements['group']) {
  const { width, depth, height, top, leg, color, legColor } = DESK
  const legH = height - top
  const lx = width / 2 - leg
  const lz = depth / 2 - leg

  return (
    <group {...props}>
      <mesh position={[0, height - top / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, top, depth]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {[
        [-lx, -lz],
        [lx, -lz],
        [-lx, lz],
        [lx, lz],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, legH / 2, z]} castShadow>
          <boxGeometry args={[leg, legH, leg]} />
          <meshStandardMaterial color={legColor} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  )
}
