import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { BoxGeometry, Color, DoubleSide, InstancedMesh, MathUtils, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, type Group } from 'three'
import { makeCanvasTexture, SANS } from '../../../utils/canvasTexture'
import { DESK } from '../../../v2/config/layout'
import { CATEGORIES, PROJECTS, type Category, type Project } from '../../../v2/data/projects'
import { CABINET as C } from '../../config/home'
import { isDrawerOpen, useHome } from '../../state/homeStore'
import { v4Materials } from '../models/materials'
import { prefersReducedMotion } from '../pointer'
import Hotspot from '../Hotspot'

const W = C.width
const D = C.depth
const T = 0.012
const TOP_Y = DESK.height - DESK.top
const H = TOP_Y - C.lift
/** 앞면 위 틀(열쇠 구멍 자리)과 아래 틀 높이 */
const RAIL_TOP = 0.03
const RAIL_BOTTOM = 0.015
const GAP = 0.004

/** 서랍 앞판: 위에서부터 [아래 끝 y, 높이] */
const FRONTS = (() => {
  const avail = H - RAIL_TOP - RAIL_BOTTOM
  const sum = C.drawers.reduce((a, b) => a + b, 0)
  let y = TOP_Y - RAIL_TOP
  return C.drawers.map((d) => {
    const h = (d / sum) * avail
    y -= h
    return [y + GAP / 2, h - GAP] as [number, number]
  })
})()

/* ── 서랍 속 파일 ─────────────────────────────────────── */

/** 카드 크기(m): 폭, 몸통 높이, 탭 높이, 탭 폭 */
const CARD = { w: W - 0.07, body: 0.12, tab: 0.026, tabW: 0.12 }
const PX = 2000

type Card = { kind: 'divider'; category: Category } | { kind: 'project'; project: Project; category: Category }

/** 앞쪽부터: 분류 칸막이 → 그 분류의 프로젝트 카드들 */
const CARDS: Card[] = CATEGORIES.flatMap((category) => [
  { kind: 'divider' as const, category },
  ...PROJECTS.filter((p) => p.category === category.id).map((project) => ({ kind: 'project' as const, project, category })),
])

/** 카드 한 장(투명 바탕 위에 몸통 + 위로 솟은 탭). 칸막이는 왼쪽 큰 탭, 프로젝트 카드는 탭 자리를 엇갈리게 */
function cardTexture(card: Card, index: number) {
  const w = Math.round(CARD.w * PX)
  const h = Math.round((CARD.body + CARD.tab) * PX)
  return makeCanvasTexture(w, h, (ctx, Wc, Hc) => {
    const tabH = CARD.tab * PX
    const divider = card.kind === 'divider'
    const tabW = (divider ? CARD.tabW * 1.25 : CARD.tabW) * PX
    const slots = [0.04, 0.37, 0.66]
    const tabX = divider ? Wc * 0.02 : Wc * slots[index % 3]
    const r = 14
    ctx.fillStyle = divider ? '#fbfaf6' : '#f1ede4'
    // 몸통
    ctx.fillRect(0, tabH, Wc, Hc - tabH)
    // 탭(위 모서리 둥글게)
    ctx.beginPath()
    ctx.moveTo(tabX, tabH + 1)
    ctx.lineTo(tabX + 10, r)
    ctx.quadraticCurveTo(tabX + 12, 0, tabX + 12 + r, 0)
    ctx.lineTo(tabX + tabW - 12 - r, 0)
    ctx.quadraticCurveTo(tabX + tabW - 12, 0, tabX + tabW - 10, r)
    ctx.lineTo(tabX + tabW, tabH + 1)
    ctx.closePath()
    ctx.fill()
    // 탭 아래 분류 색 띠(프로젝트 카드)
    ctx.fillStyle = card.category.color
    if (divider) ctx.fillRect(tabX + 18, tabH - 9, tabW - 36, 5)
    else ctx.fillRect(0, tabH + 2, Wc, 6)
    // 탭 글자
    ctx.fillStyle = '#1d1d1f'
    ctx.textBaseline = 'middle'
    if (divider) {
      ctx.font = `700 26px ${SANS}`
      ctx.fillText(card.category.label, tabX + 24, tabH * 0.42)
    } else {
      const p = card.project
      ctx.font = `600 22px ${SANS}`
      ctx.fillText(p.tab ?? p.title, tabX + 22, tabH * 0.5, tabW - 90)
      ctx.font = `500 17px ${SANS}`
      ctx.fillStyle = '#6b6a66'
      ctx.textAlign = 'right'
      ctx.fillText(p.year, tabX + tabW - 22, tabH * 0.52)
      ctx.textAlign = 'left'
    }
    // 몸통 아래쪽 은은한 그늘(앞 카드에 가려지는 쪽)
    const g = ctx.createLinearGradient(0, tabH, 0, Hc)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(60,50,40,0.18)')
    ctx.fillStyle = g
    ctx.fillRect(0, tabH, Wc, Hc - tabH)
  })
}

/** 카드 사이에 꽂힌 얇은 자료(사진·인쇄물) 묶음 */
const SHEET_COLORS = ['#e9e4d8', '#d8d2c4', '#2b2c2e', '#c7cdd3', '#a7432f', '#3c5f8f', '#f2efe8', '#8a8f86']
const SHEETS_PER_GAP = 5

function Sheets({ zs }: { zs: number[] }) {
  const ref = useRef<InstancedMesh>(null)
  const geo = useMemo(() => new BoxGeometry(CARD.w - 0.03, 1, 0.0016), [])
  const mat = useMemo(() => new MeshStandardMaterial({ roughness: 0.7 }), [])
  const count = zs.length * SHEETS_PER_GAP
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const o = new Object3D()
    const col = new Color()
    let i = 0
    zs.forEach((z, g) => {
      for (let k = 0; k < SHEETS_PER_GAP; k++) {
        const s = (g * 7 + k * 3) % SHEET_COLORS.length
        const h = 0.085 + ((g + k * 5) % 4) * 0.006
        o.position.set(((k % 3) - 1) * 0.004, h / 2, z - 0.006 - k * 0.0045)
        o.scale.set(1, h, 1)
        o.rotation.set(-0.12, 0, 0)
        o.updateMatrix()
        mesh.setMatrixAt(i, o.matrix)
        mesh.setColorAt(i, col.set(SHEET_COLORS[s]))
        i++
      }
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [zs])
  useEffect(
    () => () => {
      geo.dispose()
      mat.dispose()
    },
    [geo, mat],
  )
  return <instancedMesh ref={ref} args={[geo, mat, count]} castShadow receiveShadow />
}

/** 첫 서랍 속: 앞에서 뒤로 칸막이·카드가 조금씩 뒤로 기대어 꽂혀 있다. 원점은 서랍 바닥 앞 가운데 */
function Files({ depth }: { depth: number }) {
  const maps = useMemo(() => CARDS.map((c, i) => cardTexture(c, i)), [])
  const mats = useMemo(
    () => maps.map((map) => new MeshStandardMaterial({ map, alphaTest: 0.5, side: DoubleSide, roughness: 0.85 })),
    [maps],
  )
  useEffect(
    () => () => {
      maps.forEach((m) => m.dispose())
      mats.forEach((m) => m.dispose())
    },
    [maps, mats],
  )
  const step = (depth - 0.05) / CARDS.length
  const zs = CARDS.map((_, i) => -0.035 - i * step)
  const ch = CARD.body + CARD.tab
  return (
    <group>
      {CARDS.map((_, i) => (
        <mesh key={i} position={[0, 0.004 + (ch / 2) * Math.cos(0.12), zs[i] - (ch / 2) * Math.sin(0.12)]} rotation-x={-0.12} material={mats[i]} castShadow receiveShadow>
          <planeGeometry args={[CARD.w, ch]} />
        </mesh>
      ))}
      <Sheets zs={zs} />
    </group>
  )
}

/* ── 서랍장 ─────────────────────────────────────────── */

/** 크롬 막대 손잡이(앞판 앞에 두 기둥으로 떠 있는 막대) */
function Handle({ y, z }: { y: number; z: number }) {
  const m = v4Materials()
  return (
    <group position={[0, y, z]}>
      <mesh rotation-z={Math.PI / 2} material={m.chrome} castShadow>
        <cylinderGeometry args={[0.0055, 0.0055, 0.13, 16]} />
      </mesh>
      {[-0.058, 0.058].map((x) => (
        <mesh key={x} position={[x, 0, -0.013]} rotation-x={Math.PI / 2} material={m.chrome}>
          <cylinderGeometry args={[0.0045, 0.0045, 0.026, 12]} />
        </mesh>
      ))}
    </group>
  )
}

/** 열쇠 구멍(크롬 원통 + 검은 틈) */
function Lock({ position }: { position: [number, number, number] }) {
  const m = v4Materials()
  return (
    <group position={position}>
      <mesh rotation-x={Math.PI / 2} material={m.chrome}>
        <cylinderGeometry args={[0.0075, 0.0075, 0.006, 20]} />
      </mesh>
      <mesh position={[0, 0, 0.0031]} material={m.blackPlastic}>
        <planeGeometry args={[0.0018, 0.008]} />
      </mesh>
    </group>
  )
}

/**
 * 책상 밑 올리브 철제 서랍장(절차 모델). 위 두 칸은 얕고 아래 한 칸은 깊다. 크롬 막대 손잡이, 위 틀·가운데 서랍에 열쇠 구멍.
 * 첫 서랍은 WORK에서 열리고, 안에 칸막이와 프로젝트 카드가 꽂혀 있다(누르면 프로젝트 목록).
 * 원점은 바닥, 앞면이 +z.
 */
export default function FileCabinet(props: ThreeElements['group']) {
  const m = v4Materials()
  const olive = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: C.color,
        metalness: 0.25,
        roughness: 0.5,
        clearcoat: 0.35,
        clearcoatRoughness: 0.35,
        bumpMap: m.textures.grainFine,
        bumpScale: 0.15,
      }),
    [m],
  )
  const oliveInside = useMemo(() => new MeshPhysicalMaterial({ color: new Color(C.color).multiplyScalar(0.72), metalness: 0.2, roughness: 0.65 }), [])
  useEffect(
    () => () => {
      olive.dispose()
      oliveInside.dispose()
    },
    [olive, oliveInside],
  )

  const drawer = useRef<Group>(null)
  const open = useRef(0)
  /** 열라는 신호를 받은 뒤 지난 시간(초). 정면을 잠깐 보여 준 뒤 연다 */
  const waited = useRef(0)
  const reduced = useMemo(() => prefersReducedMotion(), [])
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const want = isDrawerOpen(useHome.getState().mode)
    waited.current = want ? waited.current + dt : 0
    const goal = want && (reduced || waited.current >= C.openDelay) ? 1 : 0
    open.current = reduced ? goal : MathUtils.damp(open.current, goal, C.openSpeed, dt)
    if (drawer.current) drawer.current.position.z = open.current * C.openDistance
  })

  const frontZ = D / 2
  const [topY, topH] = FRONTS[0]
  const boxH = topH - 0.035
  const boxD = D - 0.05

  return (
    <group {...props}>
      {/* 몸통: 옆판·뒤판·윗판·밑판 */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * (W - T)) / 2, C.lift + H / 2, 0]} material={olive} castShadow receiveShadow>
          <boxGeometry args={[T, H, D]} />
        </mesh>
      ))}
      <mesh position={[0, C.lift + H / 2, -D / 2 + T / 2]} material={olive}>
        <boxGeometry args={[W, H, T]} />
      </mesh>
      <mesh position={[0, TOP_Y - T / 2, 0]} material={olive} castShadow>
        <boxGeometry args={[W, T, D]} />
      </mesh>
      <mesh position={[0, C.lift + T / 2, 0]} material={olive} castShadow receiveShadow>
        <boxGeometry args={[W, T, D]} />
      </mesh>
      {/* 앞 틀: 위(열쇠 구멍)·아래·서랍 사이 */}
      <mesh position={[0, TOP_Y - RAIL_TOP / 2, frontZ - 0.01]} material={olive}>
        <boxGeometry args={[W, RAIL_TOP, 0.02]} />
      </mesh>
      <mesh position={[0, C.lift + RAIL_BOTTOM / 2, frontZ - 0.01]} material={olive}>
        <boxGeometry args={[W, RAIL_BOTTOM, 0.02]} />
      </mesh>
      <Lock position={[0, TOP_Y - RAIL_TOP / 2, frontZ + 0.001]} />
      {/* 안쪽 그늘(서랍이 열렸을 때 보이는 빈 칸) */}
      <mesh position={[0, topY + topH / 2, -D / 2 + T + 0.001]} material={oliveInside}>
        <planeGeometry args={[W - 2 * T, topH]} />
      </mesh>

      {/* 첫 서랍: 앞판 + 손잡이 + 속 상자 + 파일. WORK에서 앞으로 열린다 */}
      <group ref={drawer}>
        <RoundedBox args={[W - 0.026, topH, 0.018]} radius={0.004} smoothness={3} position={[0, topY + topH / 2, frontZ + 0.002]} material={olive} castShadow receiveShadow />
        <Handle y={topY + topH * 0.55} z={frontZ + 0.026} />
        <group position={[0, topY + 0.008, frontZ - 0.008]}>
          {/* 속 상자: 밑판·옆판·뒤판 */}
          <mesh position={[0, 0.003, -boxD / 2]} material={oliveInside} receiveShadow>
            <boxGeometry args={[W - 0.05, 0.006, boxD]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[(s * (W - 0.056)) / 2, boxH / 2, -boxD / 2]} material={olive} castShadow receiveShadow>
              <boxGeometry args={[0.006, boxH, boxD]} />
            </mesh>
          ))}
          <mesh position={[0, boxH / 2, -boxD + 0.003]} material={olive}>
            <boxGeometry args={[W - 0.05, boxH, 0.006]} />
          </mesh>
          <Hotspot id="files">
            <Files depth={boxD} />
          </Hotspot>
        </group>
      </group>

      {/* 나머지 서랍(닫힌 채) */}
      {FRONTS.slice(1).map(([y, h], i) => (
        <group key={i}>
          <RoundedBox args={[W - 0.026, h, 0.018]} radius={0.004} smoothness={3} position={[0, y + h / 2, frontZ + 0.002]} material={olive} castShadow receiveShadow />
          <Handle y={i === 0 ? y + h * 0.55 : y + h * 0.78} z={frontZ + 0.026} />
          {i === 0 && <Lock position={[W / 2 - 0.05, y + h * 0.55, frontZ + 0.012]} />}
        </group>
      ))}
    </group>
  )
}
