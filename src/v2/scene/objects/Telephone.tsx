import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'

const BODY = '#efe6d6'
const HANDSET = '#1d1e22'

/** 다이얼 전화기(수화기 드는 인터랙션은 이후 단계). 원점은 책상 위 본체 중앙 */
export default function Telephone(props: ThreeElements['group']) {
  return (
    <group {...props}>
      {/* 본체 */}
      <RoundedBox args={[0.2, 0.08, 0.22]} radius={0.025} position={[0, 0.04, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={BODY} roughness={0.45} />
      </RoundedBox>
      {/* 다이얼: 앞쪽 경사면 */}
      <group position={[0, 0.084, 0.055]} rotation-x={0.3}>
        <mesh>
          <cylinderGeometry args={[0.055, 0.055, 0.012, 32]} />
          <meshStandardMaterial color="#d8cdb9" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.007, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.004, 24]} />
          <meshStandardMaterial color={HANDSET} />
        </mesh>
      </group>
      {/* 수화기: 손잡이 + 양 끝 송수화부 */}
      <group position={[0, 0.1, -0.035]}>
        <mesh rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.2, 16]} />
          <meshStandardMaterial color={HANDSET} roughness={0.35} />
        </mesh>
        {[-0.095, 0.095].map((x) => (
          <mesh key={x} position={[x, -0.012, 0]} castShadow>
            <cylinderGeometry args={[0.032, 0.026, 0.035, 24]} />
            <meshStandardMaterial color={HANDSET} roughness={0.35} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
