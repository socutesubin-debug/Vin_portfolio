import { useEffect, useMemo, useState } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { CatmullRomCurve3, ExtrudeGeometry, LatheGeometry, MeshStandardMaterial, PlaneGeometry, Shape, TubeGeometry, Vector2, Vector3 } from 'three'
import { makeCanvasTexture, SANS } from '../../../utils/canvasTexture'
import { v4Materials } from './materials'

/* ───────────────────────── 플립 시계 ───────────────────────── */

const nowHM = () => {
  const d = new Date()
  return [String(d.getHours()), String(d.getMinutes()).padStart(2, '0')]
}

/** 흰 플립 카드 한 장(가운데 접힘 선, 검은 숫자) */
const cardTexture = (text: string) =>
  makeCanvasTexture(256, 220, (ctx, W, H) => {
    ctx.fillStyle = '#f6f4ef'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#161616'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `600 170px ${SANS}`
    ctx.fillText(text, W / 2, H / 2 + 8)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(0, H / 2 - 1.5, W, 3)
  })

/**
 * 플립 시계: 크롬 원형 받침 + 기둥 + 링으로 묶인 흰 카드 두 장(시·분, 지금 시각). 원점은 받침 바닥 가운데, 앞이 +z.
 */
export function FlipClockModel(props: ThreeElements['group']) {
  const m = v4Materials()
  const [[hh, mm], setTime] = useState(nowHM)
  useEffect(() => {
    const id = setInterval(() => setTime(nowHM()), 20000)
    return () => clearInterval(id)
  }, [])
  const maps = useMemo(() => [cardTexture(hh), cardTexture(mm)], [hh, mm])
  useEffect(() => () => maps.forEach((t) => t.dispose()), [maps])
  const base = useMemo(
    () =>
      new LatheGeometry(
        [
          [0, 0.0],
          [0.05, 0.0],
          [0.052, 0.004],
          [0.045, 0.012],
          [0.012, 0.022],
          [0.008, 0.03],
          [0, 0.03],
        ].map(([x, y]) => new Vector2(x, y)),
        48,
      ),
    [],
  )
  useEffect(() => () => base.dispose(), [base])
  const CW = 0.07
  const CH = 0.07
  const top = 0.125
  return (
    <group {...props}>
      <mesh geometry={base} material={m.chrome} castShadow receiveShadow />
      <mesh position={[0, 0.065, 0]} material={m.chrome} castShadow>
        <cylinderGeometry args={[0.005, 0.006, 0.07, 14]} />
      </mesh>
      {/* 가로대 + 카드 */}
      <mesh position={[0, top + CH / 2 + 0.006, 0]} rotation-z={Math.PI / 2} material={m.chrome} castShadow>
        <cylinderGeometry args={[0.004, 0.004, CW * 2 + 0.02, 12]} />
      </mesh>
      {[-1, 1].map((sx, i) => (
        <group key={sx} position={[sx * (CW / 2 + 0.003), top, 0.004]}>
          <RoundedBox args={[CW, CH, 0.006]} radius={0.003} smoothness={2} material={m.paper} castShadow />
          <mesh position={[0, 0, 0.0032]}>
            <planeGeometry args={[CW - 0.004, CH - 0.004]} />
            <meshStandardMaterial map={maps[i]} roughness={0.7} />
          </mesh>
          {/* 링 */}
          {[-0.022, 0.022].map((x) => (
            <mesh key={x} position={[x, CH / 2 + 0.006, 0]} rotation-y={Math.PI / 2} material={m.chrome}>
              <torusGeometry args={[0.006, 0.0012, 8, 16]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/* ───────────────────────── 펜꽂이 ───────────────────────── */

/** 육각 연필: 노란 몸통 + 금속 띠 + 분홍 지우개(위로 꽂혀 지우개가 보인다) */
function Pencil({ position, tilt }: { position: [number, number, number]; tilt: [number, number] }) {
  const m = v4Materials()
  return (
    <group position={position} rotation={[tilt[0], 0, tilt[1]]}>
      <mesh position={[0, 0.075, 0]} material={m.paintYellow} castShadow>
        <cylinderGeometry args={[0.0038, 0.0038, 0.15, 6]} />
      </mesh>
      <mesh position={[0, 0.153, 0]} material={m.chrome}>
        <cylinderGeometry args={[0.004, 0.004, 0.007, 12]} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.0038, 0.0038, 0.007, 12]} />
        <meshStandardMaterial color="#e79a8f" roughness={0.8} />
      </mesh>
    </group>
  )
}

/** 가위: 검은 손잡이 고리 두 개 + 위로 솟은 날 */
function Scissors(props: ThreeElements['group']) {
  const m = v4Materials()
  return (
    <group {...props}>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.014, 0.17, 0]} rotation-z={s * 0.35} material={m.blackPlastic} castShadow>
            <torusGeometry args={[0.014, 0.0035, 10, 24]} />
          </mesh>
          <mesh position={[s * 0.004, 0.1, 0]} rotation-z={s * 0.06} material={m.chrome}>
            <boxGeometry args={[0.006, 0.12, 0.002]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** 펜꽂이: 브러시드 스틸 원통(두께 있는 벽) + 연필 4자루 + 가위. 원점은 바닥 가운데 */
export function PenHolderModel(props: ThreeElements['group']) {
  const m = v4Materials()
  const cup = useMemo(
    () =>
      new LatheGeometry(
        [
          [0, 0.002],
          [0.033, 0],
          [0.035, 0.004],
          [0.035, 0.105],
          [0.0335, 0.106],
          [0.032, 0.104],
          [0.032, 0.008],
          [0, 0.008],
        ].map(([x, y]) => new Vector2(x, y)),
        48,
      ),
    [],
  )
  useEffect(() => () => cup.dispose(), [cup])
  return (
    <group {...props}>
      <mesh geometry={cup} material={m.brushedSteel} castShadow receiveShadow />
      <Pencil position={[-0.012, 0.01, -0.006]} tilt={[0.05, 0.22]} />
      <Pencil position={[-0.004, 0.01, 0.006]} tilt={[-0.05, 0.12]} />
      <Pencil position={[0.004, 0.01, -0.004]} tilt={[0.03, 0.02]} />
      <Pencil position={[0.01, 0.01, 0.008]} tilt={[-0.04, -0.06]} />
      <Scissors position={[0.012, 0.005, 0]} rotation={[0, 0.3, -0.18]} />
    </group>
  )
}

/* ───────────────────────── 다이얼 전화기 ───────────────────────── */

/** 본체 옆모양(앞이 낮은 사다리꼴, 둥근 윗면)을 폭만큼 밀어낸다 */
function phoneBody() {
  const s = new Shape()
  const b = 0.01
  s.moveTo(-0.1 + b, b)
  s.lineTo(0.1 - b, b)
  s.lineTo(0.085 - b, 0.06 - b)
  s.quadraticCurveTo(0.0, 0.11 - b, -0.075 + b, 0.1 - b)
  s.closePath()
  const g = new ExtrudeGeometry(s, { depth: 0.2 - b * 2, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 5, curveSegments: 16 })
  g.rotateY(-Math.PI / 2)
  g.translate((0.2 - b * 2) / 2, 0, 0)
  return g
}

/** 다이얼 숫자판(흰 원판 + 가운데 라벨) */
const dialTexture = () =>
  makeCanvasTexture(256, 256, (ctx, W, H) => {
    ctx.fillStyle = '#f2efe8'
    ctx.beginPath()
    ctx.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1b1b1b'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `600 22px ${SANS}`
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 - 0.5 - i * 0.48
      ctx.fillText(String((i + 1) % 10), W / 2 + Math.cos(a) * 92, H / 2 + Math.sin(a) * 92)
    }
    ctx.fillStyle = '#d9d4c7'
    ctx.beginPath()
    ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#b3302a'
    ctx.font = `600 16px ${SANS}`
    ctx.fillText('VIN', W / 2, H / 2)
  })

/**
 * 다이얼 전화기: 빨간 도장 본체 + 기울어진 앞면의 크롬 다이얼(손가락 구멍 10개) + 수화기 + 꼬인 선.
 * 원점은 바닥 가운데, 앞이 +z. [절차 모델] CONTACT(수화기 들기) 동작은 후속 단계에서 연결.
 */
export function TelephoneModel(props: ThreeElements['group']) {
  const m = v4Materials()
  const body = useMemo(() => phoneBody(), [])
  const dial = useMemo(() => dialTexture(), [])
  const handset = useMemo(
    () =>
      new TubeGeometry(
        new CatmullRomCurve3([new Vector3(-0.1, 0.0, 0), new Vector3(-0.05, 0.022, 0), new Vector3(0.05, 0.022, 0), new Vector3(0.1, 0.0, 0)]),
        32,
        0.014,
        14,
      ),
    [],
  )
  // 꼬인 선: 수화기 왼쪽 끝 → 본체 왼쪽 → 책상 위로 늘어진 나선
  const cord = useMemo(() => {
    const pts: Vector3[] = []
    const path = new CatmullRomCurve3([
      new Vector3(-0.115, 0.1, 0.0),
      new Vector3(-0.13, 0.05, 0.03),
      new Vector3(-0.14, 0.01, 0.09),
      new Vector3(-0.08, 0.008, 0.13),
    ])
    const N = 260
    for (let i = 0; i <= N; i++) {
      const t = i / N
      const p = path.getPoint(t)
      const a = t * Math.PI * 2 * 26
      pts.push(new Vector3(p.x + Math.cos(a) * 0.006, p.y + Math.sin(a) * 0.006, p.z + Math.sin(a) * 0.003))
    }
    return new TubeGeometry(new CatmullRomCurve3(pts), 900, 0.0018, 6)
  }, [])
  const dialMat = useMemo(() => new MeshStandardMaterial({ map: dial, roughness: 0.5 }), [dial])
  const fingerHole = useMemo(() => new PlaneGeometry(1, 1), [])
  useEffect(
    () => () => {
      ;[body, handset, cord, fingerHole].forEach((g) => g.dispose())
      dial.dispose()
      dialMat.dispose()
    },
    [body, handset, cord, fingerHole, dial, dialMat],
  )
  return (
    <group {...props}>
      <mesh geometry={body} material={m.paintRed} castShadow receiveShadow />
      {/* 기울어진 앞면 다이얼 */}
      <group position={[0, 0.074, 0.052]} rotation-x={-0.55}>
        <mesh position={[0, 0, 0.004]} rotation-x={Math.PI / 2} material={m.chrome} castShadow>
          <cylinderGeometry args={[0.052, 0.054, 0.008, 48]} />
        </mesh>
        <mesh position={[0, 0, 0.0085]} material={dialMat}>
          <circleGeometry args={[0.047, 48]} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => {
          const a = -Math.PI / 2 - 0.5 - i * 0.48
          return (
            <mesh key={i} position={[Math.cos(a) * 0.036, -Math.sin(a) * 0.036, 0.0095]} material={m.chrome}>
              <torusGeometry args={[0.0075, 0.0018, 8, 20]} />
            </mesh>
          )
        })}
      </group>
      {/* 수화기 받침 + 수화기 */}
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, 0.104, -0.035]} material={m.paintRed}>
          <boxGeometry args={[0.02, 0.016, 0.03]} />
        </mesh>
      ))}
      <group position={[0, 0.118, -0.035]}>
        <mesh geometry={handset} material={m.paintRed} castShadow />
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.098, -0.008, 0]} material={m.paintRed} castShadow>
            <cylinderGeometry args={[0.026, 0.022, 0.03, 32]} />
          </mesh>
        ))}
      </group>
      <mesh geometry={cord} material={m.paintRed} castShadow />
    </group>
  )
}

/* ───────────────────────── 노트·책 ───────────────────────── */

/** 줄 노트 한 쪽(손글씨 흔적) */
const pageTexture = (seed: number) =>
  makeCanvasTexture(300, 420, (ctx, W, H) => {
    ctx.fillStyle = '#f7f3ea'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = 'rgba(120, 140, 170, 0.35)'
    for (let y = 46; y < H - 20; y += 18) {
      ctx.beginPath()
      ctx.moveTo(18, y)
      ctx.lineTo(W - 18, y)
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(40, 40, 50, 0.55)'
    ctx.lineWidth = 1.4
    let s = seed
    const r = () => (s = (s * 9301 + 49297) % 233280) / 233280
    for (let i = 0; i < 7; i++) {
      const y = 60 + i * 36 + r() * 6
      const len = 80 + r() * 150
      ctx.beginPath()
      ctx.moveTo(26, y)
      for (let x = 26; x < 26 + len; x += 8) ctx.lineTo(x, y + Math.sin(x * 0.35 + i) * 2.2)
      ctx.stroke()
    }
  })

/** 펼친 쪽: 제본 쪽에서 살짝 솟았다가 바깥으로 내려앉는 곡면 */
function pageGeometry(w: number, d: number, side: 1 | -1) {
  const g = new PlaneGeometry(w, d, 16, 1)
  g.rotateX(-Math.PI / 2)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const t = (p.getX(i) + w / 2) / w // 0(왼) → 1(오)
    const fromSpine = side === 1 ? t : 1 - t
    p.setY(i, Math.sin(Math.min(1, fromSpine * 2.2) * Math.PI * 0.5) * 0.006 * (1 - fromSpine * 0.6))
  }
  g.computeVertexNormals()
  return g
}

/** 펼친 노트(종이 두께 + 곡면 쪽 + 표지) + 펜. 원점은 책상 위 가운데 */
export function NotebookModel(props: ThreeElements['group']) {
  const m = v4Materials()
  const PW = 0.15
  const PD = 0.21
  const pages = useMemo(() => [pageGeometry(PW, PD, -1), pageGeometry(PW, PD, 1)], [])
  const maps = useMemo(() => [pageTexture(3), pageTexture(11)], [])
  useEffect(
    () => () => {
      pages.forEach((g) => g.dispose())
      maps.forEach((t) => t.dispose())
    },
    [pages, maps],
  )
  return (
    <group {...props}>
      {/* 표지(붉은 갈색 천) */}
      <RoundedBox args={[PW * 2 + 0.012, 0.003, PD + 0.01]} radius={0.0012} smoothness={2} position={[0, 0.0015, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#8a3b2c" roughness={0.85} />
      </RoundedBox>
      {/* 종이 묶음 두께 */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * PW) / 2, 0.006, 0]} material={m.paper} castShadow receiveShadow>
          <boxGeometry args={[PW - 0.004, 0.006, PD - 0.004]} />
        </mesh>
      ))}
      {pages.map((g, i) => (
        <mesh key={i} geometry={g} position={[(i ? 1 : -1) * (PW / 2), 0.0092, 0]} receiveShadow>
          <meshStandardMaterial map={maps[i]} roughness={0.92} bumpMap={m.textures.paper} bumpScale={0.4} />
        </mesh>
      ))}
      {/* 펜: 검은 몸통 + 크롬 클립 */}
      <group position={[0.06, 0.017, 0.02]} rotation={[0, 0.6, Math.PI / 2]}>
        <mesh material={m.blackPlastic} castShadow>
          <cylinderGeometry args={[0.0045, 0.0045, 0.14, 16]} />
        </mesh>
        <mesh position={[0, 0.075, 0]} material={m.chrome}>
          <coneGeometry args={[0.0045, 0.012, 16]} />
        </mesh>
      </group>
    </group>
  )
}

/** 닫힌 책: 위·아래 표지판 + 왼쪽 책등 사이로 종이 단면이 보인다. 원점은 바닥 가운데 */
export function BookModel({ size = [0.15, 0.025, 0.21], cover = '#9aa3ab', ...props }: ThreeElements['group'] & { size?: [number, number, number]; cover?: string }) {
  const m = v4Materials()
  const [w, h, d] = size
  const t = 0.0022
  const coverMat = <meshStandardMaterial color={cover} roughness={0.75} />
  return (
    <group {...props}>
      {[t / 2, h - t / 2].map((y) => (
        <RoundedBox key={y} args={[w, t, d]} radius={0.0009} smoothness={2} position={[0, y, 0]} castShadow receiveShadow>
          {coverMat}
        </RoundedBox>
      ))}
      <mesh position={[-w / 2 + t / 2, h / 2, 0]} castShadow>
        <boxGeometry args={[t, h, d]} />
        {coverMat}
      </mesh>
      <mesh position={[0.0, h / 2, 0]} material={m.paper} receiveShadow>
        <boxGeometry args={[w - 0.006, h - t * 2, d - 0.006]} />
      </mesh>
    </group>
  )
}
