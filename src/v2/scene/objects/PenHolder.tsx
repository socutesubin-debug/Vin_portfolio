import type { ThreeElements } from '@react-three/fiber'
import { FINISH } from '../../config/layout'

/** 연필: 육각 몸통 + 깎은 끝(흑연) */
function Pencil({ color, tilt, yaw, h }: { color: string; tilt: number; yaw: number; h: number }) {
  return (
    <group rotation={[tilt, yaw, 0]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.0042, 0.0042, h, 6]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, h + 0.008, 0]}>
        <coneGeometry args={[0.0042, 0.016, 6]} />
        <meshStandardMaterial color="#e2c9a0" roughness={0.8} />
      </mesh>
    </group>
  )
}

/** 펜꽂이: 무광 회색 금속 원통 + 연필 세 자루 + 가위. 작은 소품이라 그림자 없음. 원점은 책상 위 바닥 가운데 */
export default function PenHolder(props: ThreeElements['group']) {
  return (
    <group {...props}>
      <mesh position={[0, 0.045, 0]} receiveShadow>
        <cylinderGeometry args={[0.032, 0.03, 0.09, 32, 1, true]} />
        <meshStandardMaterial color={FINISH.steel} metalness={0.6} roughness={0.45} side={2} />
      </mesh>
      <mesh position={[0, 0.002, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.004, 32]} />
        <meshStandardMaterial color={FINISH.steelDark} roughness={0.6} />
      </mesh>
      <group position={[0, 0.01, 0]}>
        <Pencil color="#2d2e30" tilt={0.12} yaw={0.3} h={0.15} />
        <Pencil color="#e9e4d8" tilt={-0.1} yaw={1.4} h={0.14} />
        <Pencil color="#7d8a6a" tilt={0.08} yaw={2.6} h={0.155} />
        {/* 가위: 손잡이 고리가 위로 */}
        <group position={[0.01, 0, -0.008]} rotation={[0.18, -0.6, -0.05]}>
          <mesh position={[0, 0.07, 0]}>
            <boxGeometry args={[0.012, 0.11, 0.003]} />
            <meshStandardMaterial color={FINISH.silver} metalness={1} roughness={0.25} />
          </mesh>
          {[-0.013, 0.013].map((x) => (
            <mesh key={x} position={[x, 0.135, 0]}>
              <torusGeometry args={[0.012, 0.0035, 8, 20]} />
              <meshStandardMaterial color={FINISH.black} roughness={0.5} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}
