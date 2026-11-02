import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

/** 같은 결과가 나오도록 씨앗값을 받는 간단한 난수 */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)))
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`
}

/** 나뭇결 줄무늬 */
function grain(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, r: () => number) {
  for (let i = 0; i < h / 3; i++) {
    const gy = y + r() * h
    ctx.strokeStyle = shade(base, 0.86 + r() * 0.1)
    ctx.globalAlpha = 0.18 + r() * 0.22
    ctx.lineWidth = 0.6 + r() * 1.4
    ctx.beginPath()
    ctx.moveTo(x, gy)
    for (let gx = x; gx <= x + w; gx += 64) ctx.lineTo(gx, gy + Math.sin(gx * 0.004 + i) * (1 + r() * 2.5))
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function toTexture(canvas: HTMLCanvasElement, repeat: [number, number]) {
  const t = new CanvasTexture(canvas)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(...repeat)
  t.anisotropy = 8
  return t
}

/**
 * 오크 마루. 캔버스 한 장 = 바닥 2m×2m, 널 폭 약 18cm.
 * repeat는 바닥 크기에 맞춰 Room에서 정한다.
 */
export function oakFloorTexture(base: string, repeat: [number, number]) {
  const S = 1024
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = S
  const ctx = canvas.getContext('2d')!
  const r = rng(7)
  const rows = 11
  const rowH = S / rows
  for (let i = 0; i < rows; i++) {
    // 널마다 길이와 이음새 위치를 다르게
    let x = -r() * 400
    while (x < S) {
      const len = 420 + r() * 520
      const tone = shade(base, 0.92 + r() * 0.14)
      ctx.fillStyle = tone
      ctx.fillRect(x, i * rowH, len, rowH)
      grain(ctx, x, i * rowH, len, rowH, base, r)
      ctx.fillStyle = 'rgba(80,55,30,0.28)'
      ctx.fillRect(x, i * rowH, 1.5, rowH)
      x += len
    }
    ctx.fillStyle = 'rgba(80,55,30,0.22)'
    ctx.fillRect(0, i * rowH, S, 1.5)
  }
  return toTexture(canvas, repeat)
}

/** 책상 상판 오크(결이 가로로 흐르는 한 장) */
export function oakTopTexture(base: string) {
  const W = 1024
  const H = 512
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const r = rng(21)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, W, H)
  grain(ctx, 0, 0, W, H, base, r)
  grain(ctx, 0, 0, W, H, base, r)
  return toTexture(canvas, [1, 1])
}
