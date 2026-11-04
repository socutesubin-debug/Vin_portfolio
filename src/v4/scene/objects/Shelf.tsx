import { useEffect, useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { CanvasTexture, CatmullRomCurve3, MeshPhysicalMaterial, RepeatWrapping, SRGBColorSpace, Vector3 } from 'three'
import { v4Materials } from '../models/materials'

const W = 0.95
const D = 0.38
/** 선반 판 높이(아래부터) */
const LEVELS = [0.08, 0.42, 0.82, 1.18, 1.52]
const POST = 0.035

/** 바인더 색(차분한 흰·크림·검정·푸른 회색·청록, 빨강 하나) */
const BINDER = ['#f3efe6', '#ebe5d8', '#2b2c30', '#e7e1d2', '#41607e', '#d9c9a3', '#f6f3ec', '#6f8a8f', '#b84a3e', '#dcd6c8']

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** 구멍 뚫린 앵글 기둥 무늬(세로로 반복) */
function slotTexture() {
  const c = document.createElement('canvas')
  c.width = 32
  c.height = 128
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#a9adb2'
  ctx.fillRect(0, 0, 32, 128)
  ctx.fillStyle = '#2a2b2e'
  for (let y = 10; y < 128; y += 32) {
    ctx.beginPath()
    ctx.roundRect(11, y, 10, 18, 5)
    ctx.fill()
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  return t
}

/** 바인더 한 줄(왼쪽부터 채움). 책등에 라벨·손가락 구멍 */
function Binders({ y, seed, fill, maxH }: { y: number; seed: number; fill: number; maxH: number }) {
  const m = v4Materials()
  const items = useMemo(() => {
    const r = rng(seed)
    const out: { x: number; w: number; h: number; color: string; tilt: number }[] = []
    let x = -W / 2 + 0.04
    while (x < -W / 2 + W * fill) {
      const w = 0.026 + r() * 0.03
      out.push({ x: x + w / 2, w, h: maxH * (0.82 + r() * 0.18), color: BINDER[Math.floor(r() * BINDER.length)], tilt: 0 })
      x += w + 0.002
    }
    const last = out[out.length - 1]
    if (last) last.tilt = -0.16
    return out
  }, [seed, fill, maxH])
  return (
    <group position={[0, y + 0.009, 0]}>
      {items.map((b, i) => (
        <group key={i} position={[b.x + (b.tilt ? 0.03 : 0), 0, 0]} rotation-z={b.tilt}>
          <RoundedBox args={[b.w, b.h, D * 0.72]} radius={0.003} smoothness={2} position={[0, b.h / 2, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={b.color} roughness={0.6} />
          </RoundedBox>
          {/* 책등 라벨 + 손가락 구멍 */}
          <mesh position={[0, b.h * 0.68, (D * 0.72) / 2 + 0.0008]} material={m.paper}>
            <planeGeometry args={[b.w * 0.62, b.h * 0.22]} />
          </mesh>
          <mesh position={[0, b.h * 0.22, (D * 0.72) / 2 + 0.0008]}>
            <circleGeometry args={[b.w * 0.18, 16]} />
            <meshStandardMaterial color="#1c1c1e" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** 수납 상자: 금속(은색) 또는 검은 상자, 앞 손잡이·이름표 */
function StorageBox({ x, y, w, h, metal }: { x: number; y: number; w: number; h: number; metal?: boolean }) {
  const m = v4Materials()
  return (
    <group position={[x, y + 0.009, 0]}>
      <RoundedBox
        args={[w, h, D * 0.86]}
        radius={0.005}
        smoothness={2}
        position={[0, h / 2, 0]}
        material={metal ? m.brushedSteel : m.blackPlastic}
        castShadow
        receiveShadow
      />
      {/* 뚜껑 테 */}
      <mesh position={[0, h - 0.012, (D * 0.86) / 2 + 0.002]} material={metal ? m.chrome : m.steelDark}>
        <boxGeometry args={[w + 0.004, 0.022, 0.004]} />
      </mesh>
      <mesh position={[0, h * 0.5, (D * 0.86) / 2 + 0.002]} material={m.paper}>
        <planeGeometry args={[w * 0.28, h * 0.16]} />
      </mesh>
      <mesh position={[0, h * 0.3, (D * 0.86) / 2 + 0.006]} material={m.chrome}>
        <boxGeometry args={[w * 0.22, 0.008, 0.008]} />
      </mesh>
    </group>
  )
}

/** 필름 카메라: 검은 몸체 + 은색 윗판 + 렌즈 */
function FilmCamera(props: ThreeElements['group']) {
  const m = v4Materials()
  return (
    <group {...props}>
      <RoundedBox args={[0.14, 0.06, 0.05]} radius={0.006} smoothness={2} position={[0, 0.03, 0]} material={m.blackPlastic} castShadow />
      <RoundedBox args={[0.142, 0.022, 0.052]} radius={0.005} smoothness={2} position={[0, 0.07, 0]} material={m.chrome} castShadow />
      <mesh position={[0.0, 0.085, 0]} material={m.blackPlastic}>
        <boxGeometry args={[0.04, 0.02, 0.04]} />
      </mesh>
      <group position={[0, 0.035, 0.045]} rotation-x={Math.PI / 2}>
        <mesh material={m.chrome} castShadow>
          <cylinderGeometry args={[0.028, 0.03, 0.04, 32]} />
        </mesh>
        <mesh position={[0, 0.021, 0]} material={m.blackPlastic}>
          <cylinderGeometry args={[0.022, 0.022, 0.004, 32]} />
        </mesh>
      </group>
    </group>
  )
}

/** 버섯 조명(켜진 채): 우윳빛 갓이 따뜻하게 빛나고 주변을 조금 밝힌다 */
function MushroomLamp(props: ThreeElements['group']) {
  const glow = useMemo(
    () => new MeshPhysicalMaterial({ color: '#fff4e2', emissive: '#ffd9a0', emissiveIntensity: 1.6, roughness: 0.35, transmission: 0, clearcoat: 0.6 }),
    [],
  )
  useEffect(() => () => glow.dispose(), [glow])
  return (
    <group {...props}>
      <mesh position={[0, 0.07, 0]} material={glow} castShadow>
        <cylinderGeometry args={[0.025, 0.045, 0.14, 32]} />
      </mesh>
      <mesh position={[0, 0.14, 0]} material={glow} castShadow>
        <sphereGeometry args={[0.1, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <pointLight position={[0, 0.12, 0.05]} color="#ffcf8a" intensity={0.35} distance={0.9} decay={2} />
    </group>
  )
}

/** 늘어진 덩굴 식물(포토스): 화분 + 아래로 처지는 줄기 몇 가닥을 따라 잎 */
function HangingPlant(props: ThreeElements['group']) {
  const vines = useMemo(() => {
    const r = rng(41)
    return Array.from({ length: 6 }, (_, k) => {
      const dir = k < 4 ? -1 : 1
      const len = 0.5 + r() * 0.6
      const curve = new CatmullRomCurve3([
        new Vector3(0, 0.1, 0),
        new Vector3(dir * (0.08 + r() * 0.06), 0.06, 0.06 + r() * 0.05),
        new Vector3(dir * (0.14 + r() * 0.08), -len * 0.5, 0.1 + r() * 0.06),
        new Vector3(dir * (0.12 + r() * 0.1), -len, 0.08 + r() * 0.08),
      ])
      const n = Math.floor(len * 26)
      return Array.from({ length: n }, (_, i) => {
        const p = curve.getPoint(i / n)
        return { p: [p.x, p.y, p.z] as [number, number, number], rot: r() * Math.PI * 2, s: 0.022 + r() * 0.016, c: ['#4f7a3e', '#5f8a4a', '#6f9a57'][i % 3] }
      })
    }).flat()
  }, [])
  return (
    <group {...props}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.055, 0.1, 28]} />
        <meshStandardMaterial color="#efeae0" roughness={0.45} />
      </mesh>
      {vines.map((l, i) => (
        <mesh key={i} position={l.p} rotation={[l.rot, l.rot * 0.7, 0.4]} scale={[l.s, l.s * 0.65, 0.004]} castShadow>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={l.c} roughness={0.55} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * 오른쪽 철제 선반(기준 home-final.png): 구멍 뚫린 앵글 기둥 + 판 5장.
 * 맨 위 상자·덩굴 식물 / 바인더·켜진 버섯 조명 / 바인더·필름 카메라·책 / 금속·검은 수납 상자.
 * [절차 모델] 원점은 바닥, 앞면이 +z.
 */
export default function Shelf(props: ThreeElements['group']) {
  const m = v4Materials()
  const H = LEVELS[LEVELS.length - 1] + 0.03
  const slots = useMemo(() => {
    const t = slotTexture()
    t.repeat.set(1, H / 0.12)
    return t
  }, [H])
  useEffect(() => () => slots.dispose(), [slots])
  const postMat = useMemo(() => new MeshPhysicalMaterial({ map: slots, metalness: 0.6, roughness: 0.42 }), [slots])
  useEffect(() => () => postMat.dispose(), [postMat])

  return (
    <group {...props}>
      {/* L자 앵글 기둥 4개(앞면·옆면 두 장) */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`} position={[(sx * (W - POST)) / 2, H / 2, (sz * (D - POST)) / 2]}>
            <mesh position={[0, 0, sz * (POST / 2 - 0.001)]} material={postMat} castShadow receiveShadow>
              <boxGeometry args={[POST, H, 0.002]} />
            </mesh>
            <mesh position={[sx * (POST / 2 - 0.001), 0, 0]} material={postMat} castShadow receiveShadow>
              <boxGeometry args={[0.002, H, POST]} />
            </mesh>
          </group>
        )),
      )}
      {LEVELS.map((y) => (
        <group key={y} position={[0, y, 0]}>
          <mesh material={m.brushedSteel} castShadow receiveShadow>
            <boxGeometry args={[W, 0.018, D]} />
          </mesh>
          {/* 앞 테두리(접힌 철판) */}
          <mesh position={[0, -0.012, D / 2]} material={m.brushedSteel}>
            <boxGeometry args={[W, 0.03, 0.003]} />
          </mesh>
        </group>
      ))}

      {/* 아래 두 칸: 수납 상자 */}
      <StorageBox x={-0.2} y={LEVELS[0]} w={0.4} h={0.22} metal />
      <StorageBox x={0.24} y={LEVELS[0]} w={0.38} h={0.22} />
      <StorageBox x={-0.2} y={LEVELS[1]} w={0.4} h={0.2} metal />
      <StorageBox x={0.24} y={LEVELS[1]} w={0.38} h={0.2} />
      {/* 바인더 + 필름 카메라 + 쌓인 책 */}
      <Binders y={LEVELS[2]} seed={7} fill={0.66} maxH={0.32} />
      <FilmCamera position={[0.3, LEVELS[2] + 0.04, 0.04]} />
      <group position={[0.3, LEVELS[2] + 0.009, 0.02]}>
        {[0, 1].map((i) => (
          <RoundedBox key={i} args={[0.2, 0.018, 0.26]} radius={0.002} smoothness={2} position={[0, 0.009 + i * 0.018, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={i ? '#e9e3d6' : '#c7c0b0'} roughness={0.75} />
          </RoundedBox>
        ))}
      </group>
      {/* 바인더 + 켜진 버섯 조명 */}
      <Binders y={LEVELS[3]} seed={19} fill={0.56} maxH={0.34} />
      <MushroomLamp position={[0.3, LEVELS[3] + 0.009, 0.02]} />
      {/* 맨 위: 검은 상자 · 크라프트 상자 · 덩굴 식물 */}
      <StorageBox x={0.22} y={LEVELS[4]} w={0.42} h={0.17} />
      <group position={[-0.08, LEVELS[4] + 0.009, 0]}>
        <RoundedBox args={[0.22, 0.13, 0.26]} radius={0.004} smoothness={2} position={[0, 0.065, 0]} castShadow>
          <meshStandardMaterial color="#c9a87a" roughness={0.85} />
        </RoundedBox>
      </group>
      <HangingPlant position={[-0.33, LEVELS[4] + 0.009, 0.06]} />
    </group>
  )
}
