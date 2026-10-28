import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'

const FABRIC = '#3a3d46'
const METAL = '#2a2a2e'
const SEAT_Y = 0.46

/** 사무용 의자. 원점은 바닥, 앉는 방향이 -z(책상 쪽), 등받이가 +z */
export default function Chair(props: ThreeElements['group']) {
  return (
    <group {...props}>
      <RoundedBox args={[0.46, 0.07, 0.44]} radius={0.025} position={[0, SEAT_Y, 0]} castShadow>
        <meshStandardMaterial color={FABRIC} roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[0.44, 0.48, 0.06]} radius={0.025} position={[0, SEAT_Y + 0.3, 0.22]} rotation-x={-0.1} castShadow>
        <meshStandardMaterial color={FABRIC} roughness={0.85} />
      </RoundedBox>

      {/* 기둥 */}
      <mesh position={[0, (SEAT_Y - 0.05) / 2 + 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, SEAT_Y - 0.05, 16]} />
        <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* 다리 5개 + 바퀴 */}
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <group key={i} rotation-y={a}>
            <mesh position={[0.15, 0.06, 0]} castShadow>
              <boxGeometry args={[0.3, 0.025, 0.035]} />
              <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0.29, 0.025, 0]} rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.025, 0.025, 0.02, 12]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
