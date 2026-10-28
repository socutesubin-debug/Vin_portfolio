import type { ThreeElements } from '@react-three/fiber'

/** 명함(90×55mm). 원점은 책상 위 중앙 */
export default function BusinessCard(props: ThreeElements['group']) {
  return (
    <group {...props}>
      <mesh position={[0, 0.001, 0]} rotation-y={0.25} castShadow receiveShadow>
        <boxGeometry args={[0.09, 0.002, 0.055]} />
        <meshStandardMaterial color="#fbfaf7" roughness={0.8} />
      </mesh>
    </group>
  )
}
