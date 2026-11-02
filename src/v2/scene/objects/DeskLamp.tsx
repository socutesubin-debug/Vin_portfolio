import type { ThreeElements } from '@react-three/fiber'
import { FINISH } from '../../config/layout'

/** 머스터드 옐로우 광택 도장(포인트 ①). 관절은 크롬 */
const paint = <meshPhysicalMaterial color={FINISH.yellow} roughness={0.32} clearcoat={0.8} clearcoatRoughness={0.12} />
const metal = <meshStandardMaterial color={FINISH.silver} metalness={1} roughness={0.2} />

function Joint({ r = 0.014 }: { r?: number }) {
  return (
    <mesh>
      <sphereGeometry args={[r, 16, 12]} />
      {metal}
    </mesh>
  )
}

/**
 * 관절형 노란 스탠드(머스터드 옐로우 광택, 크롬 관절). 켜고 끄는 인터랙션은 이후 단계.
 * 원점은 책상 위 받침 중앙. 팔은 로컬 +x 쪽으로 뻗는다.
 */
export default function DeskLamp(props: ThreeElements['group']) {
  return (
    <group {...props}>
      <mesh position={[0, 0.012, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.085, 0.024, 40]} />
        {paint}
      </mesh>
      {/* 아래 팔 */}
      <group position={[0, 0.03, 0]} rotation-z={-0.3}>
        <Joint />
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.4, 12]} />
          {paint}
        </mesh>
        {/* 위 팔 */}
        <group position={[0, 0.4, 0]} rotation-z={-1.2}>
          <Joint />
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.007, 0.007, 0.32, 12]} />
            {paint}
          </mesh>
          {/* 금속 갓: 아래를 향하는 원뿔 */}
          <group position={[0, 0.32, 0]} rotation-z={1.35}>
            <Joint r={0.012} />
            <mesh position={[0, -0.06, 0]} castShadow>
              <coneGeometry args={[0.075, 0.13, 40, 1, true]} />
              <meshPhysicalMaterial color={FINISH.yellow} roughness={0.3} clearcoat={0.9} clearcoatRoughness={0.1} side={2} />
            </mesh>
            {/* 갓 안쪽 전구(꺼진 상태) */}
            <mesh position={[0, -0.1, 0]}>
              <sphereGeometry args={[0.022, 16, 12]} />
              <meshStandardMaterial color="#f4efe6" roughness={0.3} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
