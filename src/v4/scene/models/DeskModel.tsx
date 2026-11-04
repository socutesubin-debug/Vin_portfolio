import type { ThreeElements } from '@react-three/fiber'
import { MeshReflectorMaterial, RoundedBox } from '@react-three/drei'
import { DESK } from '../../../v2/config/layout'
import { DESK_FINISH } from '../../config/home'
import { v4Materials } from './materials'

const TOP = 0.032
const LEG = 0.038
/** 가운데 얕은 서랍(연필 서랍) 폭 — 오른쪽은 서랍장이 받친다 */
const DRAWER = { x0: -0.72, x1: 0.18, h: 0.07 }

/**
 * 철제 책상: 두께 있는 브러시드 스틸 상판(둥근 모서리) + 상판 밑 테두리 + 가운데 얕은 서랍 + 각관 다리·발.
 * 상판 윗면은 주변 사물을 흐리게 비추는 반사면(거울 X, 넓고 부드러운 반사). 휴대폰은 반사를 끄고 결만 남긴다.
 * 원점은 바닥 중앙. [절차 모델]
 */
export default function DeskModel({ reflect = true, ...props }: ThreeElements['group'] & { reflect?: boolean }) {
  const m = v4Materials()
  const { width, depth, height } = DESK
  const legH = height - TOP
  const lx = width / 2 - 0.05
  const lz = depth / 2 - 0.05
  const apronY = legH - 0.035
  const R = DESK_FINISH.reflection

  return (
    <group {...props}>
      {/* 상판: 두께·둥근 모서리. 옆면과 모서리는 결 있는 브러시드 스틸 */}
      <RoundedBox args={[width, TOP, depth]} radius={0.007} smoothness={4} position={[0, height - TOP / 2, 0]} material={m.brushedSteel} castShadow receiveShadow />
      {reflect && (
        <mesh position={[0, height + 0.0004, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[width - 0.012, depth - 0.012]} />
          <MeshReflectorMaterial
            color={R.color}
            metalness={R.metalness}
            roughness={R.roughness}
            roughnessMap={m.textures.brushed}
            blur={R.blur}
            resolution={R.resolution}
            mixBlur={1}
            mixStrength={R.strength}
            mixContrast={1}
            mirror={0}
            depthScale={0.6}
            minDepthThreshold={0.2}
            maxDepthThreshold={1.2}
          />
        </mesh>
      )}

      {/* 상판 밑 테두리(앞·뒤·옆) */}
      {[-lz, lz].map((z) => (
        <mesh key={z} position={[0, apronY, z]} material={m.steelDark} castShadow receiveShadow>
          <boxGeometry args={[lx * 2, 0.07, 0.018]} />
        </mesh>
      ))}
      {[-lx, lx].map((x) => (
        <mesh key={x} position={[x, apronY, 0]} material={m.steelDark} receiveShadow>
          <boxGeometry args={[0.018, 0.07, lz * 2]} />
        </mesh>
      ))}

      {/* 가운데 얕은 서랍: 앞판 + 오목한 손잡이 */}
      <group position={[(DRAWER.x0 + DRAWER.x1) / 2, legH - DRAWER.h / 2 - 0.004, depth / 2 - 0.035]}>
        <RoundedBox args={[DRAWER.x1 - DRAWER.x0, DRAWER.h, 0.02]} radius={0.003} smoothness={2} material={m.steelDark} castShadow receiveShadow />
        <mesh position={[0, -0.006, 0.0105]} material={m.blackPlastic}>
          <boxGeometry args={[0.13, 0.014, 0.002]} />
        </mesh>
        <mesh position={[0, -0.0, 0.013]} material={m.chrome} castShadow>
          <boxGeometry args={[0.14, 0.006, 0.008]} />
        </mesh>
      </group>

      {/* 각관 다리 + 높이 조절 발 */}
      {[
        [-lx, -lz],
        [lx, -lz],
        [-lx, lz],
        [lx, lz],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <RoundedBox args={[LEG, legH - 0.012, LEG]} radius={0.004} smoothness={2} position={[0, (legH + 0.012) / 2, 0]} material={m.steelDark} castShadow receiveShadow />
          <mesh position={[0, 0.006, 0]} material={m.blackPlastic} castShadow>
            <cylinderGeometry args={[0.016, 0.018, 0.012, 20]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
