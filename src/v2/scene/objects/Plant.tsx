import type { ThreeElements } from '@react-three/fiber'

/** 길쭉한 잎 하나(납작한 타원체) */
function Leaf({ yaw, pitch, len, color }: { yaw: number; pitch: number; len: number; color: string }) {
  return (
    <group rotation={[0, yaw, pitch]}>
      <mesh position={[0, len / 2, 0]} scale={[0.018, len / 2, 0.006]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  )
}

const LEAVES = Array.from({ length: 11 }, (_, i) => ({
  yaw: (i / 11) * Math.PI * 2 + (i % 2) * 0.3,
  pitch: 0.25 + (i % 3) * 0.18,
  len: 0.13 + ((i * 7) % 5) * 0.02,
  color: ['#5f8a4a', '#6f9a57', '#4f7a3e'][i % 3],
}))

/** 창턱 화분: 흰 도자기 화분 + 길쭉한 잎. 작은 소품이라 그림자 없음. 원점은 화분 바닥 가운데 */
export default function Plant(props: ThreeElements['group']) {
  return (
    <group {...props}>
      <mesh position={[0, 0.045, 0]} receiveShadow>
        <cylinderGeometry args={[0.05, 0.04, 0.09, 28]} />
        <meshStandardMaterial color="#f2efe8" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.088, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.046, 24]} />
        <meshStandardMaterial color="#5b4636" roughness={0.95} />
      </mesh>
      <group position={[0, 0.085, 0]}>
        {LEAVES.map((l, i) => (
          <Leaf key={i} {...l} />
        ))}
      </group>
    </group>
  )
}
