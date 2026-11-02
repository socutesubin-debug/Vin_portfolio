import type { ThreeElements } from '@react-three/fiber'

const CERAMIC = '#eee8dc'

/** 머그컵 하나("작업 흔적"). 원점은 책상 위 컵 바닥 중앙 */
export default function Mug(props: ThreeElements['group']) {
  return (
    <group {...props}>
      {/* 몸통: 위가 뚫린 원통 */}
      <mesh position={[0, 0.048, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.038, 0.096, 40, 1, true]} />
        <meshStandardMaterial color={CERAMIC} roughness={0.32} side={2} />
      </mesh>
      <mesh position={[0, 0.002, 0]}>
        <cylinderGeometry args={[0.038, 0.038, 0.004, 40]} />
        <meshStandardMaterial color={CERAMIC} roughness={0.32} />
      </mesh>
      {/* 남은 커피 */}
      <mesh position={[0, 0.07, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.038, 40]} />
        <meshStandardMaterial color="#3a2618" roughness={0.15} />
      </mesh>
      {/* 손잡이 */}
      <mesh position={[0.04, 0.05, 0]} rotation-z={-Math.PI / 2} castShadow>
        <torusGeometry args={[0.022, 0.0065, 12, 24, Math.PI]} />
        <meshStandardMaterial color={CERAMIC} roughness={0.32} />
      </mesh>
    </group>
  )
}
