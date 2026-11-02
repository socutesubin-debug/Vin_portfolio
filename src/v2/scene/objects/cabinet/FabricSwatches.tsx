import { useEffect, useMemo } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Shape, ShapeGeometry } from 'three'
import { makeCanvasTexture, SANS } from '../../../../utils/canvasTexture'

/**
 * 이스터에그 서랍 ①: 원단 스와치(임시).
 * 실제 원단 사진이 생기면 SWATCHES의 패턴 대신 이미지 텍스처로 바꾸면 된다.
 */

type Pattern = 'linen' | 'herringbone' | 'houndstooth' | 'gingham' | 'corduroy' | 'twill'

/** 차분한 원단 톤(코발트블루는 WORK 폴더 전용이라 쓰지 않는다) */
const SWATCHES: { pattern: Pattern; base: string; ink: string }[] = [
  { pattern: 'linen', base: '#d9cbb0', ink: '#b9a88a' },
  { pattern: 'herringbone', base: '#6f6b5a', ink: '#4f4b3e' },
  { pattern: 'houndstooth', base: '#ece4d6', ink: '#3b3a3d' },
  { pattern: 'gingham', base: '#efe8dc', ink: '#b8673f' },
  { pattern: 'corduroy', base: '#8a5a3c', ink: '#6d4630' },
  { pattern: 'twill', base: '#5c6470', ink: '#454c56' },
]

/** 원단 결 패턴을 캔버스로 그린다(한 장이 반복된다) */
function fabricTexture(pattern: Pattern, base: string, ink: string) {
  const S = 64
  const c = document.createElement('canvas')
  c.width = c.height = S
  const ctx = c.getContext('2d')!
  ctx.fillStyle = base
  ctx.fillRect(0, 0, S, S)
  ctx.fillStyle = ink
  ctx.strokeStyle = ink
  if (pattern === 'linen') {
    ctx.globalAlpha = 0.5
    for (let i = 0; i < S; i += 3) {
      ctx.fillRect(0, i, S, 1)
      ctx.fillRect(i, 0, 1, S)
    }
  } else if (pattern === 'herringbone') {
    ctx.lineWidth = 3
    for (let y = -S; y < S * 2; y += 8) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(S / 2, y + S / 2)
      ctx.lineTo(S, y)
      ctx.stroke()
    }
  } else if (pattern === 'houndstooth') {
    const u = S / 4
    for (let y = 0; y < S; y += u)
      for (let x = 0; x < S; x += u)
        if (((x + y) / u) % 2 === 0) {
          ctx.fillRect(x, y, u / 2, u / 2)
          ctx.beginPath()
          ctx.moveTo(x + u / 2, y)
          ctx.lineTo(x + u, y)
          ctx.lineTo(x + u / 2, y + u / 2)
          ctx.fill()
        }
  } else if (pattern === 'gingham') {
    ctx.globalAlpha = 0.45
    for (let i = 0; i < S; i += 16) {
      ctx.fillRect(0, i, S, 8)
      ctx.fillRect(i, 0, 8, S)
    }
  } else if (pattern === 'corduroy') {
    for (let x = 0; x < S; x += 6) ctx.fillRect(x, 0, 2, S)
  } else {
    ctx.lineWidth = 2
    for (let i = -S; i < S * 2; i += 6) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + S, S)
      ctx.stroke()
    }
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  // 무늬 크기: 하운드투스는 무늬 한 칸이 커서 더 잘게 반복한다
  const k = pattern === 'houndstooth' ? 2.6 : 1
  t.repeat.set(3 * k, 2.4 * k)
  t.anisotropy = 8
  return t
}

/** 핑킹가위로 자른 지그재그 가장자리 사각형 */
function pinkedShape(w: number, h: number, tooth = 0.012) {
  const s = new Shape()
  const n = Math.round(w / tooth)
  const m = Math.round(h / tooth)
  s.moveTo(-w / 2, -h / 2)
  for (let i = 1; i <= n; i++) s.lineTo(-w / 2 + (i * w) / n, -h / 2 + (i % 2 ? -tooth / 2 : 0))
  for (let i = 1; i <= m; i++) s.lineTo(w / 2 + (i % 2 ? tooth / 2 : 0), -h / 2 + (i * h) / m)
  for (let i = 1; i <= n; i++) s.lineTo(w / 2 - (i * w) / n, h / 2 + (i % 2 ? tooth / 2 : 0))
  for (let i = 1; i <= m; i++) s.lineTo(-w / 2 + (i % 2 ? -tooth / 2 : 0), h / 2 - (i * h) / m)
  return s
}

function tagTexture(n: number) {
  return makeCanvasTexture(256, 96, (ctx, w, h) => {
    ctx.fillStyle = '#f7f3ea'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#2a2a30'
    ctx.font = `500 40px ${SANS}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`SWATCH ${String(n).padStart(2, '0')}`, w / 2, h / 2 + 2)
  })
}

/** 서랍 바닥에 3×2로 살짝 비뚤게 펼쳐 둔 원단 조각(원점은 서랍 안쪽 바닥 중앙, 참고 디자인 단위) */
export default function FabricSwatches({ width, depth }: { width: number; depth: number }) {
  const sw = Math.min(0.27, width / 3.4)
  const sh = Math.min(0.2, depth / 2.8)
  const geo = useMemo(() => new ShapeGeometry(pinkedShape(sw, sh)), [sw, sh])
  const maps = useMemo(() => SWATCHES.map((s) => fabricTexture(s.pattern, s.base, s.ink)), [])
  const tags = useMemo(() => SWATCHES.map((_, i) => tagTexture(i + 1)), [])
  useEffect(
    () => () => {
      geo.dispose()
      maps.forEach((m) => m.dispose())
      tags.forEach((t) => t.dispose())
    },
    [geo, maps, tags],
  )

  return (
    <group>
      {SWATCHES.map((_, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const x = (col - 1) * (width / 3.1)
        const z = (row - 0.5) * (depth / 2.3)
        const rot = ((i * 37) % 11) / 100 - 0.05
        return (
          <group key={i} position={[x, 0.004 + i * 0.0006, z]} rotation-y={rot}>
            <mesh geometry={geo} rotation-x={-Math.PI / 2} receiveShadow>
              <meshStandardMaterial map={maps[i]} roughness={0.95} />
            </mesh>
            {/* 이름표 */}
            <mesh position={[-sw / 2 + 0.05, 0.002, sh / 2 - 0.03]} rotation-x={-Math.PI / 2}>
              <planeGeometry args={[0.085, 0.032]} />
              <meshStandardMaterial map={tags[i]} roughness={0.8} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
