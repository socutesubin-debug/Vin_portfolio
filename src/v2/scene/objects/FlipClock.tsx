import { useEffect, useMemo, useState } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { CanvasTexture, SRGBColorSpace } from 'three'

const BODY = { w: 0.13, h: 0.075, d: 0.06 }

/** 지금 시각 "HH:MM" */
const nowHM = () => {
  const d = new Date()
  return [d.getHours(), d.getMinutes()].map((n) => String(n).padStart(2, '0'))
}

/** 플립 카드 두 장(시·분): 가운데 가로 접힘 선이 있는 검은 카드에 흰 숫자 */
function draw(c: HTMLCanvasElement, hh: string, mm: string) {
  const ctx = c.getContext('2d')!
  const W = c.width
  const H = c.height
  ctx.fillStyle = '#2a2b2e'
  ctx.fillRect(0, 0, W, H)
  const card = (x: number, text: string) => {
    const cw = W * 0.46
    ctx.fillStyle = '#141516'
    ctx.beginPath()
    ctx.roundRect(x, H * 0.08, cw, H * 0.84, 18)
    ctx.fill()
    ctx.fillStyle = '#f4f1ea'
    ctx.font = "600 150px Inter, 'Helvetica Neue', Arial, sans-serif"
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x + cw / 2, H * 0.53)
    ctx.fillStyle = '#2a2b2e'
    ctx.fillRect(x, H * 0.495, cw, 4)
  }
  card(W * 0.02, hh)
  card(W * 0.52, mm)
}

/**
 * 플립 시계: 실제 지금 시각(시:분)을 보여 주고 1분마다 갱신한다.
 * 작은 소품이라 그림자는 만들지 않는다. 원점은 책상 위 바닥 가운데, 앞면이 +z.
 */
export default function FlipClock(props: ThreeElements['group']) {
  const [time, setTime] = useState(nowHM)
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 256
    return c
  }, [])
  const tex = useMemo(() => {
    const t = new CanvasTexture(canvas)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [canvas])

  // 다음 분이 시작될 때마다 갱신
  useEffect(() => {
    let id = 0
    const tick = () => {
      setTime(nowHM())
      id = window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50)
    }
    id = window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    draw(canvas, time[0], time[1])
    tex.needsUpdate = true
  }, [canvas, tex, time])
  useEffect(() => () => tex.dispose(), [tex])

  return (
    <group {...props}>
      <RoundedBox args={[BODY.w, BODY.h, BODY.d]} radius={0.01} smoothness={3} position={[0, BODY.h / 2, 0]} receiveShadow>
        <meshStandardMaterial color="#2a2b2e" roughness={0.45} />
      </RoundedBox>
      <mesh position={[0, BODY.h / 2, BODY.d / 2 + 0.0005]}>
        <planeGeometry args={[BODY.w * 0.9, BODY.h * 0.82]} />
        <meshStandardMaterial map={tex} roughness={0.5} />
      </mesh>
    </group>
  )
}
