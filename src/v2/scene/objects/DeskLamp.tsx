import type { ThreeElements } from '@react-three/fiber'

const METAL = '#2a2a2e'

/** 스탠드 조명(켜고 끄는 인터랙션은 이후 단계). 원점은 책상 위 받침 중앙 */
export default function DeskLamp(props: ThreeElements['group']) {
  return (
    <group {...props}>
      <mesh position={[0, 0.01, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.02, 32]} />
        <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 아래 팔: 뒤로 살짝 기울어진 기둥 */}
      <group position={[0, 0.02, 0]} rotation-z={-0.25}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, 0.4, 12]} />
          <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.4} />
        </mesh>
        {/* 위 팔: 앞쪽(+x)으로 뻗음 */}
        <group position={[0, 0.4, 0]} rotation-z={-1.15}>
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.009, 0.009, 0.3, 12]} />
            <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.4} />
          </mesh>
          {/* 갓: 아래를 향하는 원뿔 */}
          <group position={[0, 0.3, 0]} rotation-z={1.4}>
            <mesh position={[0, -0.05, 0]} castShadow>
              <coneGeometry args={[0.07, 0.11, 32, 1, true]} />
              <meshStandardMaterial color="#1e278f" side={2} roughness={0.5} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
