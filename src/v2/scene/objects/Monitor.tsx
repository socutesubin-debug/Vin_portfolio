import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { FINISH } from '../../config/layout'

const SHELL = '#2b2c30'
/** 화면 중심 높이(그룹 원점 = 책상 상판 기준) */
export const SCREEN_Y = 0.31

/** 모니터: 실버 받침·목 + 얇은 베젤 화면. 원점은 책상 위 받침 중앙 */
export default function Monitor(props: ThreeElements['group']) {
  return (
    <group {...props}>
      <RoundedBox args={[0.22, 0.01, 0.16]} radius={0.004} smoothness={3} position={[0, 0.005, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={FINISH.silver} metalness={0.9} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.09, -0.035]} castShadow>
        <boxGeometry args={[0.05, 0.17, 0.012]} />
        <meshStandardMaterial color={FINISH.silver} metalness={0.9} roughness={0.3} />
      </mesh>
      <RoundedBox args={[0.62, 0.38, 0.018]} radius={0.006} smoothness={3} position={[0, SCREEN_Y, 0]} castShadow>
        <meshStandardMaterial color={SHELL} metalness={0.5} roughness={0.4} />
      </RoundedBox>
      {/* 화면(나중에 이력서/소개 텍스처가 들어갈 자리). 꺼진 듯 은은한 밝기 */}
      <mesh position={[0, SCREEN_Y + 0.004, 0.0095]}>
        <planeGeometry args={[0.6, 0.35]} />
        <meshStandardMaterial color="#ecebe7" emissive="#f2efe8" emissiveIntensity={0.28} roughness={0.25} />
      </mesh>
    </group>
  )
}
