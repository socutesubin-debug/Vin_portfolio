import type { ThreeElements } from '@react-three/fiber'

const BODY = '#1d1e22'
/** 화면 중심 높이(그룹 원점 = 책상 상판 기준) */
export const SCREEN_Y = 0.31

/** 모니터: 받침 + 목 + 화면. 원점은 책상 위 받침 중앙 */
export default function Monitor(props: ThreeElements['group']) {
  return (
    <group {...props}>
      <mesh position={[0, 0.006, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.012, 0.16]} />
        <meshStandardMaterial color={BODY} roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.08, -0.03]} castShadow>
        <boxGeometry args={[0.04, 0.15, 0.03]} />
        <meshStandardMaterial color={BODY} roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, SCREEN_Y, 0]} castShadow>
        <boxGeometry args={[0.62, 0.38, 0.025]} />
        <meshStandardMaterial color={BODY} roughness={0.35} />
      </mesh>
      {/* 화면(나중에 이력서/소개 텍스처가 들어갈 자리) */}
      <mesh position={[0, SCREEN_Y, 0.0135]}>
        <planeGeometry args={[0.58, 0.34]} />
        <meshStandardMaterial color="#e9ecf5" emissive="#dfe4f2" emissiveIntensity={0.55} roughness={0.3} />
      </mesh>
    </group>
  )
}
