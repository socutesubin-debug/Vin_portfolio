import { useEffect, useMemo, type ReactNode } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { ExtrudeGeometry, PlaneGeometry, ShapeGeometry, type Material } from 'three'
import { makeCanvasTexture, SANS } from '../../../utils/canvasTexture'
import { loft, roundedRectLoop, roundedRectShape } from './geometry'
import { v4Materials } from './materials'

/** 치수(m). 원점은 책상 위 본체 바닥 가운데, 앞이 +z */
const CASE = { w: 0.44, h: 0.115, d: 0.4 }
const STAND_H = 0.028
const FRONT = { w: 0.4, h: 0.36, r: 0.03, depth: 0.03, bevel: 0.009 }
/** 화면 구멍(앞판) — 아래 베젤이 더 두껍게 조금 위로 */
const OPENING = { w: 0.334, h: 0.262, r: 0.018, dy: 0.012 }
/** 유리(구멍 안쪽으로 들어간 곳) */
const GLASS_SIZE = { w: 0.302, h: 0.228, r: 0.012 }
const RECESS = 0.028
const BULGE = 0.009
/** CRT 앞판이 놓이는 z(본체 앞면보다 조금 뒤) */
const FRONT_Z = CASE.d / 2 - 0.03
const CRT_Y = CASE.h + STAND_H + FRONT.h / 2

/** 화면 유리 정보(컴퓨터 원점 기준). 커서·발광 표시를 유리 위에 붙일 때 쓴다 */
export const GLASS = {
  w: GLASS_SIZE.w,
  h: GLASS_SIZE.h,
  center: [0, CRT_Y + OPENING.dy, FRONT_Z - RECESS] as [number, number, number],
  /** 유리 위 한 점(가운데 기준 -0.5~0.5)의 볼록한 높이 */
  bulgeAt: (u: number, v: number) => BULGE * (1 - (2 * u) ** 2) * (1 - (2 * v) ** 2),
}

/** 살짝 볼록한 유리: 가운데가 앞으로 나온 곡면. 모서리는 베젤 안쪽에 가려진다 */
function glassGeometry() {
  const g = new PlaneGeometry(GLASS_SIZE.w + 0.004, GLASS_SIZE.h + 0.004, 32, 24)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / (GLASS_SIZE.w + 0.004)
    const v = p.getY(i) / (GLASS_SIZE.h + 0.004)
    p.setZ(i, GLASS.bulgeAt(u, v))
  }
  g.computeVertexNormals()
  return g
}

function geometries() {
  // 앞판: 둥근 사각형에 화면 구멍, 두께와 둥근 모서리(베벨)
  const shape = roundedRectShape(FRONT.w, FRONT.h, FRONT.r, 10)
  shape.holes.push(roundedRectShape(OPENING.w, OPENING.h, OPENING.r, 8, OPENING.dy))
  const front = new ExtrudeGeometry(shape, {
    depth: FRONT.depth,
    bevelEnabled: true,
    bevelThickness: FRONT.bevel,
    bevelSize: FRONT.bevel,
    bevelSegments: 5,
    curveSegments: 10,
  })
  front.translate(0, 0, -(FRONT.depth + FRONT.bevel))

  // 베젤 안쪽: 구멍 가장자리에서 유리까지 비스듬히 들어가는 면
  const n = 8
  const recess = loft(
    [
      { loop: roundedRectLoop(OPENING.w - FRONT.bevel * 2 + 0.002, OPENING.h - FRONT.bevel * 2 + 0.002, OPENING.r - 0.004, n), z: -0.002, dy: OPENING.dy },
      { loop: roundedRectLoop(GLASS_SIZE.w + 0.006, GLASS_SIZE.h + 0.006, GLASS_SIZE.r, n), z: -RECESS - 0.001, dy: OPENING.dy },
    ],
    true,
  )

  // 뒤 몸통: 앞판 크기에서 뒤로 갈수록 좁아지는 브라운관 하우징
  const body = loft([
    { loop: roundedRectLoop(FRONT.w - 0.012, FRONT.h - 0.012, FRONT.r, 10), z: -FRONT.depth - FRONT.bevel },
    { loop: roundedRectLoop(FRONT.w - 0.03, FRONT.h - 0.024, FRONT.r + 0.006, 10), z: -0.1 },
    { loop: roundedRectLoop(0.27, 0.25, 0.05, 10), z: -0.34, dy: 0.012 },
  ])
  const backCap = new ShapeGeometry(roundedRectShape(0.27, 0.25, 0.05, 10))
  backCap.rotateY(Math.PI)
  backCap.translate(0, 0.012, -0.34)

  return { front, recess, body, backCap, glass: glassGeometry() }
}

/** 본체 앞면 스티커(사양 표기 줄) */
const labelTexture = () =>
  makeCanvasTexture(280, 100, (ctx, W, H) => {
    ctx.fillStyle = '#ece5d3'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#3b3a37'
    ctx.font = `600 15px ${SANS}`
    ctx.fillText('VIN · PERSONAL SYSTEM', 12, 22)
    ctx.fillStyle = 'rgba(59,58,55,0.55)'
    for (let i = 0; i < 6; i++) ctx.fillRect(12, 34 + i * 10, 140 + ((i * 53) % 90), 3)
  })

/** 앞판 왼쪽 위 작은 로고 */
const badgeTexture = () =>
  makeCanvasTexture(160, 40, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(80, 74, 62, 0.75)'
    ctx.font = `600 20px ${SANS}`
    ctx.fillText('VISION', 6, 28)
  })

/**
 * 레트로 컴퓨터: 베이지 본체 + 받침대 + CRT 모니터(깊이 있는 테이퍼 하우징, 둥근 앞판, 안으로 들어간 베젤, 볼록한 유리).
 * screen: 화면 유리 재질(발광은 CrtMonitor가 맡는다). children은 CRT 앞판 기준으로 붙는다.
 * [절차 모델] 외부 에셋 없이 코드로 만든 형태. 최종 GLB로 바꿀 때도 GLASS 위치만 맞추면 된다.
 */
export default function CrtModel({ screen, children, ...props }: ThreeElements['group'] & { screen: Material; children?: ReactNode }) {
  const m = v4Materials()
  const g = useMemo(() => geometries(), [])
  const label = useMemo(() => labelTexture(), [])
  const badge = useMemo(() => badgeTexture(), [])
  useEffect(
    () => () => {
      Object.values(g).forEach((x) => x.dispose())
      label.dispose()
      badge.dispose()
    },
    [g, label, badge],
  )
  const fz = CASE.d / 2

  return (
    <group {...props}>
      {/* ── 본체 ── */}
      <RoundedBox args={[CASE.w, CASE.h, CASE.d]} radius={0.01} smoothness={4} position={[0, CASE.h / 2, 0]} material={m.beige} castShadow receiveShadow />
      {/* 앞면 아래 이음선 */}
      <mesh position={[0, 0.018, fz + 0.0005]} material={m.beigeShade}>
        <boxGeometry args={[CASE.w - 0.02, 0.003, 0.002]} />
      </mesh>
      {/* 드라이브 베이: 들어간 테두리 + 검은 덮개 + 슬롯 */}
      <group position={[0.1, 0.066, fz]}>
        <mesh material={m.beigeShade} position={[0, 0, -0.002]}>
          <boxGeometry args={[0.19, 0.052, 0.006]} />
        </mesh>
        <RoundedBox args={[0.178, 0.042, 0.006]} radius={0.002} smoothness={2} position={[0, 0, -0.001]} material={m.blackPlastic} />
        <mesh position={[0, 0.006, 0.0025]} material={m.beigeShade}>
          <boxGeometry args={[0.12, 0.003, 0.001]} />
        </mesh>
        <mesh position={[0.07, -0.012, 0.0025]}>
          <boxGeometry args={[0.012, 0.006, 0.002]} />
          <meshStandardMaterial color="#7fd37a" emissive="#5fbf6a" emissiveIntensity={0.9} />
        </mesh>
      </group>
      {/* 사양 스티커 */}
      <mesh position={[-0.11, 0.068, fz + 0.0008]}>
        <planeGeometry args={[0.15, 0.054]} />
        <meshStandardMaterial map={label} roughness={0.85} />
      </mesh>
      {/* 전원 스위치 */}
      <RoundedBox args={[0.02, 0.016, 0.008]} radius={0.002} smoothness={2} position={[0.2, 0.03, fz + 0.002]} material={m.beigeDark} />

      {/* ── 받침대(회전·기울기 받침) ── */}
      <mesh position={[0, CASE.h + 0.006, 0.0]} scale={[1, 1, 0.78]} material={m.beigeDark} castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.135, 0.012, 48]} />
      </mesh>
      <mesh position={[0, CASE.h + 0.018, -0.02]} scale={[1, 1, 0.7]} material={m.beigeShade} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.016, 40]} />
      </mesh>

      {/* ── CRT ── */}
      <group position={[0, CRT_Y, FRONT_Z]}>
        <mesh geometry={g.front} material={m.beige} castShadow receiveShadow />
        <mesh geometry={g.recess} material={m.beigeDark} receiveShadow />
        <mesh geometry={g.body} material={m.beige} castShadow receiveShadow />
        <mesh geometry={g.backCap} material={m.beigeDark} />
        {/* 볼록한 유리(가장자리는 베젤 안쪽에 묻힌다) */}
        <mesh geometry={g.glass} material={screen} position={[0, OPENING.dy, -RECESS]} />
        {/* 뒤 몸통 위 통풍구 */}
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position={[-0.075 + i * 0.025, 0.155, -0.2]} rotation-x={-0.12} material={m.beigeShade}>
            <boxGeometry args={[0.012, 0.004, 0.09]} />
          </mesh>
        ))}
        {/* 앞판 로고 + 아래 조작부(다이얼 2, 전원 표시등) */}
        <mesh position={[-0.13, FRONT.h / 2 - 0.022, 0.0005]}>
          <planeGeometry args={[0.06, 0.015]} />
          <meshStandardMaterial map={badge} transparent roughness={0.6} />
        </mesh>
        {[0.118, 0.148].map((x) => (
          <group key={x} position={[x, -FRONT.h / 2 + 0.028, 0]} rotation-x={Math.PI / 2}>
            <mesh material={m.beigeShade}>
              <cylinderGeometry args={[0.0085, 0.0095, 0.008, 24]} />
            </mesh>
          </group>
        ))}
        <mesh position={[-0.14, -FRONT.h / 2 + 0.028, 0.001]}>
          <circleGeometry args={[0.0028, 16]} />
          <meshStandardMaterial color="#9fe08f" emissive="#6fd36a" emissiveIntensity={1.2} />
        </mesh>
        {children}
      </group>
    </group>
  )
}
