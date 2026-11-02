import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { FINISH } from '../../config/layout'

/** 레트로 베이지 마우스. 원점은 책상 위 중앙 */
export default function Mouse(props: ThreeElements['group']) {
  return (
    <group {...props}>
      <RoundedBox args={[0.065, 0.03, 0.105]} radius={0.014} smoothness={4} position={[0, 0.015, 0]}>
        <meshStandardMaterial color={FINISH.beige} roughness={0.5} />
      </RoundedBox>
      {/* 버튼 경계 */}
      <mesh position={[0, 0.0302, -0.02]}>
        <boxGeometry args={[0.0015, 0.001, 0.05]} />
        <meshStandardMaterial color={FINISH.beigeDark} />
      </mesh>
    </group>
  )
}
