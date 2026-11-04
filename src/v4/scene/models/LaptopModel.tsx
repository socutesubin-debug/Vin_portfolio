import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { BoxGeometry, InstancedMesh, MeshPhysicalMaterial, Object3D, type Material } from 'three'
import { v4Materials } from './materials'

/** 본체 폭·깊이·두께, 덮개 높이(m). 15인치급 */
const W = 0.34
const D = 0.235
const BASE_H = 0.016
const LID_H = 0.225
const LID_T = 0.006
/** 덮개가 세로에서 뒤로 젖혀진 각(라디안) */
const LID_TILT = 0.28

/** 화면(덮개 앞면) 크기와 덮개 안 자리. 16:10 */
export const SCREEN = { w: W - 0.03, h: (W - 0.03) / 1.6, y: LID_H / 2 + 0.004 }

const KEY = 0.0172
const PITCH = 0.0195
/** 키 줄: 각 키의 폭(칸 단위). 맨 아래 줄은 긴 스페이스 */
const ROWS: number[][] = [
  ...Array.from({ length: 5 }, () => Array<number>(14).fill(1)),
  [1, 1, 1, 1.4, 5.4, 1.4, 1, 1, 1],
]

/** 키캡(InstancedMesh, 검은 무광) */
function Keys({ material }: { material: Material }) {
  const ref = useRef<InstancedMesh>(null)
  const geo = useMemo(() => new BoxGeometry(1, 0.0016, KEY), [])
  const count = ROWS.reduce((n, r) => n + r.length, 0)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const o = new Object3D()
    const total = 14 * PITCH
    let i = 0
    ROWS.forEach((row, r) => {
      const span = row.reduce((a, b) => a + b, 0)
      let x = -total / 2
      row.forEach((u) => {
        const w = (u / span) * total
        o.position.set(x + w / 2, 0, -0.1 + r * PITCH)
        o.scale.set(w - (PITCH - KEY), 1, 1)
        o.updateMatrix()
        mesh.setMatrixAt(i++, o.matrix)
        x += w
      })
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [])
  useEffect(() => () => geo.dispose(), [geo])
  return <instancedMesh ref={ref} args={[geo, material, count]} position={[0, BASE_H + 0.0004, 0]} receiveShadow />
}

/**
 * 노트북(절차 모델): 알루미늄 본체 + 검은 키보드 + 트랙패드, 뒤로 젖힌 덮개와 검은 베젤.
 * 원점은 책상 위 본체 가운데, 화면이 +z(방문자 쪽). children은 화면 가운데 기준(앞면 +z)으로 놓인다(커서 등).
 */
export default function LaptopModel({ screen, children, ...props }: ThreeElements['group'] & { screen: Material; children?: ReactNode }) {
  const m = v4Materials()
  const mats = useMemo(
    () => ({
      alu: new MeshPhysicalMaterial({ color: '#b8bbbf', metalness: 0.85, roughness: 0.36, roughnessMap: m.textures.grainFine, clearcoat: 0.2, clearcoatRoughness: 0.4 }),
      pad: new MeshPhysicalMaterial({ color: '#a9adb2', metalness: 0.8, roughness: 0.5 }),
      key: new MeshPhysicalMaterial({ color: '#1b1c1e', roughness: 0.6 }),
      bezel: new MeshPhysicalMaterial({ color: '#0b0c0d', roughness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.15 }),
    }),
    [m],
  )
  useEffect(() => () => Object.values(mats).forEach((x) => x.dispose()), [mats])

  return (
    <group {...props}>
      {/* 본체 */}
      <RoundedBox args={[W, BASE_H, D]} radius={0.006} smoothness={4} position={[0, BASE_H / 2, 0]} material={mats.alu} castShadow receiveShadow />
      {/* 키보드 자리(조금 어두운 판) + 키 */}
      <mesh position={[0, BASE_H + 0.0002, -0.1 + 2.5 * PITCH]} rotation-x={-Math.PI / 2} material={m.blackPlastic}>
        <planeGeometry args={[14 * PITCH + 0.006, 6 * PITCH + 0.006]} />
      </mesh>
      <Keys material={mats.key} />
      {/* 트랙패드 */}
      <mesh position={[0, BASE_H + 0.0003, 0.068]} rotation-x={-Math.PI / 2} material={mats.pad} receiveShadow>
        <planeGeometry args={[0.11, 0.07]} />
      </mesh>

      {/* 경첩 + 덮개(뒤로 젖힘) */}
      <group position={[0, BASE_H, -D / 2 + 0.006]} rotation-x={-LID_TILT}>
        <mesh rotation-z={Math.PI / 2} material={mats.bezel}>
          <cylinderGeometry args={[0.005, 0.005, W * 0.8, 16]} />
        </mesh>
        <RoundedBox args={[W, LID_H, LID_T]} radius={0.004} smoothness={3} position={[0, LID_H / 2, -LID_T / 2]} material={mats.alu} castShadow />
        {/* 베젤 */}
        <mesh position={[0, LID_H / 2, 0.0002]} material={mats.bezel}>
          <planeGeometry args={[W - 0.006, LID_H - 0.006]} />
        </mesh>
        {/* 카메라 */}
        <mesh position={[0, LID_H - 0.007, 0.0004]} material={m.blackPlastic}>
          <circleGeometry args={[0.0015, 12]} />
        </mesh>
        <group position={[0, SCREEN.y, 0.0005]}>
          <mesh material={screen}>
            <planeGeometry args={[SCREEN.w, SCREEN.h]} />
          </mesh>
          {children}
        </group>
      </group>
    </group>
  )
}
