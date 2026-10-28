import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'

/** 마우스. 원점은 책상 위 중앙 */
export default function Mouse(props: ThreeElements['group']) {
  return (
    <group {...props}>
      <RoundedBox args={[0.06, 0.028, 0.1]} radius={0.012} position={[0, 0.014, 0]} castShadow>
        <meshStandardMaterial color="#e6e4df" roughness={0.5} />
      </RoundedBox>
    </group>
  )
}
