import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { DESK, FINISH } from '../../config/layout'

const steelTop = <meshStandardMaterial color={FINISH.steel} metalness={0.55} roughness={0.42} />
const steelFrame = <meshStandardMaterial color={FINISH.steelDark} metalness={0.6} roughness={0.45} />

/** 책상: 회색 철판 상판 + 짙은 철제 각관 다리와 앞뒤 가로대(산업용). 원점은 바닥 중앙 */
export default function Desk(props: ThreeElements['group']) {
  const { width, depth, height, top } = DESK
  const legH = height - top
  const tube = 0.035
  const lx = width / 2 - 0.04
  const lz = depth / 2 - 0.04
  const railY = legH - 0.04

  return (
    <group {...props}>
      <RoundedBox args={[width, top, depth]} radius={0.006} smoothness={3} position={[0, height - top / 2, 0]} castShadow receiveShadow>
        {steelTop}
      </RoundedBox>

      {/* 각관 다리 4개 */}
      {[
        [-lx, -lz],
        [lx, -lz],
        [-lx, lz],
        [lx, lz],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, legH / 2, z]} castShadow>
          <boxGeometry args={[tube, legH, tube]} />
          {steelFrame}
        </mesh>
      ))}

      {/* 상판 밑 테두리 프레임 */}
      {[-lz, lz].map((z) => (
        <mesh key={z} position={[0, railY, z]}>
          <boxGeometry args={[lx * 2, 0.05, 0.02]} />
          {steelFrame}
        </mesh>
      ))}
      {[-lx, lx].map((x) => (
        <mesh key={x} position={[x, railY, 0]}>
          <boxGeometry args={[0.02, 0.05, lz * 2]} />
          {steelFrame}
        </mesh>
      ))}
    </group>
  )
}
