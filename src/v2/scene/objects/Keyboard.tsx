import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'

/** 키보드. 원점은 책상 위 중앙 */
export default function Keyboard(props: ThreeElements['group']) {
  return (
    <group {...props}>
      <RoundedBox args={[0.44, 0.018, 0.14]} radius={0.006} position={[0, 0.009, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e6e4df" roughness={0.6} />
      </RoundedBox>
      {/* 키 영역 */}
      <mesh position={[0, 0.0185, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.41, 0.11]} />
        <meshStandardMaterial color="#d2d0ca" roughness={0.7} />
      </mesh>
    </group>
  )
}
