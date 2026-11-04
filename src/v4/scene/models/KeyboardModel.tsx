import { useEffect, useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { CatmullRomCurve3, ExtrudeGeometry, Object3D, Shape, ShapeGeometry, TubeGeometry, Vector3, type BufferGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { loft, roundedRectLoop, roundedRectShape } from './geometry'
import { v4Materials } from './materials'

/** 키 간격(1u)과 몸체 치수(m). 원점은 책상 위 키보드 바닥 가운데, 앞(방문자 쪽)이 +z */
const U = 0.019
const BODY = { w: 0.47, d: 0.19, front: 0.021, back: 0.036 }
const SLOPE = Math.atan((BODY.back - BODY.front) / BODY.d)
const KEY_H = 0.0105

type Key = { x: number; row: number; w: number; h?: number; dark?: boolean }

/** 104키 배열: 주 블록 15u + 방향키 3u + 숫자 키패드 4u. row 0은 펑션 줄(맨 뒤) */
function layout(): Key[] {
  const keys: Key[] = []
  const put = (row: number, start: number, widths: (number | [number, boolean])[], gap = 0) => {
    let x = start
    for (const item of widths) {
      const [w, dark] = typeof item === 'number' ? [item, false] : item
      if (w < 0) {
        x += -w
        continue
      }
      keys.push({ x: x + w / 2, row, w, dark })
      x += w + gap
    }
  }
  const D = (w: number): [number, boolean] => [w, true]
  // 주 블록
  put(0, 0, [D(1), -1, 1, 1, 1, 1, -0.5, D(1), D(1), D(1), D(1), -0.5, 1, 1, 1, 1])
  put(1, 0, [...Array(13).fill(1), D(2)])
  put(2, 0, [D(1.5), ...Array(12).fill(1), D(1.5)])
  put(3, 0, [D(1.75), ...Array(11).fill(1), D(2.25)])
  put(4, 0, [D(2.25), ...Array(10).fill(1), D(2.75)])
  put(5, 0, [D(1.5), D(1), D(1.5), 7, D(1.5), D(1), D(1.5)])
  // 방향키 묶음
  const nav = 15.5
  put(0, nav, [D(1), D(1), D(1)])
  put(1, nav, [D(1), D(1), D(1)])
  put(2, nav, [D(1), D(1), D(1)])
  put(4, nav + 1, [D(1)])
  put(5, nav, [D(1), D(1), D(1)])
  // 숫자 키패드(+·Enter는 두 줄 높이)
  const pad = nav + 3.5
  put(1, pad, [D(1), D(1), D(1), D(1)])
  put(2, pad, [1, 1, 1])
  put(3, pad, [1, 1, 1])
  put(4, pad, [1, 1, 1])
  put(5, pad, [2, 1])
  keys.push({ x: pad + 3.5, row: 2.5, w: 1, h: 2, dark: true }, { x: pad + 3.5, row: 4.5, w: 1, h: 2, dark: true })
  return keys
}

/** 키캡 하나: 아래가 넓고 위가 좁은 둥근 사각 기둥 + 윗면 */
function keycapGeometry(wu: number, hu: number) {
  const w = wu * U - 0.0026
  const d = hu * U - 0.0026
  const tw = w - 0.0048
  const td = d - 0.0048
  const side = loft([
    { loop: roundedRectLoop(w, d, 0.0016, 3), z: 0 },
    { loop: roundedRectLoop(w - 0.0012, d - 0.0012, 0.0018, 3), z: KEY_H * 0.55 },
    { loop: roundedRectLoop(tw, td, 0.0022, 3), z: KEY_H, dy: 0.0008 },
  ])
  side.deleteAttribute('uv')
  const top = new ShapeGeometry(roundedRectShape(tw, td, 0.0022, 3, 0.0008))
  top.deleteAttribute('uv')
  top.translate(0, 0, KEY_H)
  const g = mergeGeometries([side.toNonIndexed(), top.toNonIndexed()])!
  g.rotateX(-Math.PI / 2)
  g.computeVertexNormals()
  side.dispose()
  top.dispose()
  return g
}

/** 몸체 윗면 높이(z 위치에서). 앞(+z)이 낮고 뒤가 높다 */
const topAt = (z: number) => BODY.front + ((BODY.back - BODY.front) * (BODY.d / 2 - z)) / BODY.d

/**
 * 몸체: 옆에서 본 쐐기 모양(앞 낮고 뒤 높음)을 폭만큼 밀어낸다.
 * 베벨이 바깥으로 b만큼 부풀기 때문에 모양을 b만큼 안쪽으로 그려, 둥근 모서리를 단 뒤 정확히 BODY 치수가 되게 한다.
 */
function bodyGeometry() {
  const b = 0.005
  const hz = BODY.d / 2
  const s = new Shape()
  s.moveTo(-hz + b, b)
  s.lineTo(hz - b, b)
  s.lineTo(hz - b, BODY.front - b)
  s.lineTo(-hz + b, BODY.back - b)
  s.closePath()
  const g = new ExtrudeGeometry(s, { depth: BODY.w - b * 2, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4 })
  // 모양의 x → 월드 z(앞이 +), 밀어낸 방향 → 월드 x
  g.rotateY(-Math.PI / 2)
  g.translate((BODY.w - b * 2) / 2, 0, 0)
  return g
}

/** 키 폭·높이·색 조합별 인스턴스 묶음 */
function keyGroups() {
  const keys = layout()
  const totalU = 23
  const groups = new Map<string, { geo: BufferGeometry; dark: boolean; matrices: Object3D[] }>()
  const dummy = new Object3D()
  for (const k of keys) {
    const h = k.h ?? 1
    const id = `${k.w}-${h}-${k.dark ? 1 : 0}`
    if (!groups.has(id)) groups.set(id, { geo: keycapGeometry(k.w, h), dark: !!k.dark, matrices: [] })
    // 펑션 줄은 0.25u 떨어져 있다
    const rowZ = k.row === 0 ? 0 : k.row + 0.25
    const o = dummy.clone()
    o.position.set((k.x - totalU / 2) * U, 0, (rowZ - 2.9 + (h - 1) / 2) * U)
    groups.get(id)!.matrices.push(o)
  }
  return [...groups.values()]
}

/** 키보드 뒤에서 본체로 가는 꼬인 케이블 */
function cableGeometry(points: [number, number, number][]) {
  return new TubeGeometry(new CatmullRomCurve3(points.map((p) => new Vector3(...p))), 48, 0.0028, 8)
}

/**
 * 레트로 베이지 키보드: 쐐기 몸체 + 개별 키캡 104개(높이·간격·윗면이 좁아지는 형태).
 * 밝은 글자키와 짙은 기능키. [절차 모델] 키 각인(글자)은 아직 없다.
 */
export default function KeyboardModel(props: ThreeElements['group']) {
  const m = v4Materials()
  const body = useMemo(() => bodyGeometry(), [])
  const groups = useMemo(() => keyGroups(), [])
  const cable = useMemo(
    () =>
      cableGeometry([
        [0.12, 0.012, -BODY.d / 2],
        [0.14, 0.004, -BODY.d / 2 - 0.05],
        [0.2, 0.003, -BODY.d / 2 - 0.09],
        [0.24, 0.004, -BODY.d / 2 - 0.12],
      ]),
    [],
  )
  useEffect(
    () => () => {
      body.dispose()
      cable.dispose()
      groups.forEach((g) => g.geo.dispose())
    },
    [body, cable, groups],
  )
  // 키 묶음 가운데(z)의 윗면 높이. 키는 2mm만 묻히고 나머지가 솟는다
  const plateZ = 0.008
  const plateY = topAt(plateZ) - 0.002

  return (
    <group {...props}>
      <mesh geometry={body} material={m.beige} castShadow receiveShadow />
      {/* 키: 기울어진 윗면에 조금 묻혀 선다 */}
      <group position={[0, plateY, plateZ]} rotation-x={SLOPE}>
        {groups.map((g, i) => (
          <instancedMesh
            key={i}
            args={[g.geo, g.dark ? m.keyDark : m.keyLight, g.matrices.length]}
            receiveShadow
            castShadow
            ref={(im) => {
              if (!im) return
              g.matrices.forEach((o, j) => {
                o.updateMatrix()
                im.setMatrixAt(j, o.matrix)
              })
              im.instanceMatrix.needsUpdate = true
              im.computeBoundingSphere()
            }}
          />
        ))}
      </group>
      {/* 오른쪽 위 표시등 3개 */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0.16 + i * 0.018, topAt(-BODY.d / 2 + 0.018) + 0.0004, -BODY.d / 2 + 0.018]} rotation-x={-Math.PI / 2 + SLOPE}>
          <planeGeometry args={[0.006, 0.003]} />
          <meshStandardMaterial color={i === 0 ? '#86d07c' : '#7b776c'} emissive={i === 0 ? '#5fbf6a' : '#000000'} emissiveIntensity={0.6} />
        </mesh>
      ))}
      <mesh geometry={cable} material={m.beigeDark} castShadow />
    </group>
  )
}

/** 마우스: 둥근 등 + 바닥판 + 버튼 갈라짐 + 케이블. 원점은 책상 위 바닥 가운데 */
export function MouseModel(props: ThreeElements['group']) {
  const m = v4Materials()
  const cable = useMemo(
    () =>
      cableGeometry([
        [0, 0.012, -0.055],
        [0.0, 0.004, -0.1],
        [-0.04, 0.003, -0.16],
        [-0.12, 0.003, -0.2],
      ]),
    [],
  )
  useEffect(() => () => cable.dispose(), [cable])
  return (
    <group {...props}>
      <mesh position={[0, 0.004, 0]} scale={[0.031, 0.024, 0.056]} material={m.beige} castShadow receiveShadow>
        <sphereGeometry args={[1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0.002, 0]} scale={[0.031, 1, 0.056]} material={m.beigeShade} castShadow>
        <cylinderGeometry args={[1, 0.96, 0.004, 40]} />
      </mesh>
      {/* 좌우 버튼 갈라짐 */}
      <mesh position={[0, 0.0245, -0.03]} rotation-x={0.55} material={m.beigeShade}>
        <boxGeometry args={[0.0012, 0.0015, 0.03]} />
      </mesh>
      <mesh geometry={cable} material={m.beigeDark} castShadow />
    </group>
  )
}
