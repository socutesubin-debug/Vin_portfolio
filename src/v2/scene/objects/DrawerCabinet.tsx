import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { CABINET } from '../../config/layout'

/** 서랍장(서랍 3칸). 원점은 바닥 중앙, 서랍 앞면이 +z */
export default function DrawerCabinet(props: ThreeElements['group']) {
  const { width, height, depth, caster, drawers, color } = CABINET
  const gap = 0.008
  const inset = 0.015
  const frontH = (height - inset * 2 - gap * (drawers - 1)) / drawers

  return (
    <group {...props}>
      <group position={[0, caster, 0]}>
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color={color} roughness={0.45} metalness={0.15} />
        </mesh>

        {/* 서랍 앞판 + 손잡이. 아래부터 0, 1, 2 */}
        {Array.from({ length: drawers }, (_, i) => {
          const y = inset + frontH / 2 + i * (frontH + gap)
          return (
            <group key={i} position={[0, y, depth / 2 + 0.006]}>
              <RoundedBox args={[width - inset * 2, frontH, 0.012]} radius={0.004} castShadow>
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.15} />
              </RoundedBox>
              <mesh position={[0, frontH / 2 - 0.035, 0.012]}>
                <boxGeometry args={[0.14, 0.014, 0.012]} />
                <meshStandardMaterial color="#c9ccd6" metalness={0.8} roughness={0.25} />
              </mesh>
            </group>
          )
        })}
      </group>

      {/* 바퀴 */}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (width / 2 - 0.04), caster / 2, sz * (depth / 2 - 0.04)]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[caster / 2, caster / 2, 0.02, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
    </group>
  )
}
