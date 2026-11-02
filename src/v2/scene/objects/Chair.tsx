import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { FINISH } from '../../config/layout'

const SEAT_Y = 0.47
const chrome = <meshStandardMaterial color={FINISH.silver} metalness={1} roughness={0.15} />
const leather = <meshStandardMaterial color={FINISH.leather} roughness={0.42} />

/** 사무용 의자: 다크 브라운 가죽 좌판·등판 + 크롬 프레임. 원점은 바닥, 앉는 방향이 -z, 등받이가 +z */
export default function Chair(props: ThreeElements['group']) {
  return (
    <group {...props}>
      <RoundedBox args={[0.48, 0.08, 0.46]} radius={0.035} smoothness={4} position={[0, SEAT_Y, 0]} castShadow>
        {leather}
      </RoundedBox>
      <RoundedBox args={[0.46, 0.44, 0.07]} radius={0.035} smoothness={4} position={[0, SEAT_Y + 0.33, 0.25]} rotation-x={-0.12} castShadow>
        {leather}
      </RoundedBox>

      {/* 등판을 받치는 크롬 프레임(좌우) */}
      {[-0.2, 0.2].map((x) => (
        <group key={x}>
          <mesh position={[x, SEAT_Y - 0.02, 0.13]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.009, 0.009, 0.26, 10]} />
            {chrome}
          </mesh>
          <mesh position={[x, SEAT_Y + 0.12, 0.27]} rotation-x={-0.12}>
            <cylinderGeometry args={[0.009, 0.009, 0.28, 10]} />
            {chrome}
          </mesh>
        </group>
      ))}

      {/* 기둥 */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.026, 0.42, 20]} />
        {chrome}
      </mesh>

      {/* 크롬 5발 받침 + 바퀴 */}
      {Array.from({ length: 5 }, (_, i) => (
        <group key={i} rotation-y={(i / 5) * Math.PI * 2}>
          <mesh position={[0.16, 0.065, 0]} rotation-z={0.08} castShadow>
            <boxGeometry args={[0.32, 0.022, 0.036]} />
            {chrome}
          </mesh>
          <mesh position={[0.3, 0.026, 0]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.026, 0.026, 0.022, 14]} />
            <meshStandardMaterial color={FINISH.black} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
