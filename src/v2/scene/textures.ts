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

/**
 * 창밖 풍경: 옅은 벽돌 벽 앞에 초록 나무. 햇살에 밝게 날아간 느낌으로 살짝 흐리게 그린다.
 * 사진 대신 코드로 그려서 외부 이미지가 필요 없다.
 */
export function windowViewTexture() {
  const W = 1024
  const H = 1024
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const r = rng(5)

  // 밝은 하늘(위쪽 조금)
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.3)
  sky.addColorStop(0, '#f4f7f6')
  sky.addColorStop(1, '#eef1ec')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  // 건너편 벽돌 벽
  const top = H * 0.18
  ctx.fillStyle = '#d9b9a2'
  ctx.fillRect(0, top, W, H - top)
  const bh = 26
  const bw = 72
  for (let y = top, row = 0; y < H; y += bh, row++) {
    for (let x = row % 2 ? -bw / 2 : 0; x < W; x += bw) {
      ctx.fillStyle = shade('#d4ad93', 0.92 + r() * 0.14)
      ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4)
    }
  }
  // 벽돌 벽에 난 창 하나
  ctx.fillStyle = '#c9cfcc'
  ctx.fillRect(W * 0.62, top + 120, 150, 210)
  ctx.fillStyle = '#e6e2da'
  ctx.fillRect(W * 0.62 + 70, top + 120, 10, 210)

  // 나무: 둥근 잎 덩어리 여러 개(앞쪽일수록 진하게)
  ctx.filter = 'blur(3px)'
  const greens = ['#8fae6b', '#7b9c5a', '#6a8b4c', '#a3bf7e']
  for (let i = 0; i < 70; i++) {
    const cx = W * (0.05 + r() * 0.55)
    const cy = H * (0.15 + r() * 0.55)
    const rad = 50 + r() * 90
    ctx.fillStyle = greens[i % greens.length]
    ctx.globalAlpha = 0.75 + r() * 0.25
    ctx.beginPath()
    ctx.arc(cx, cy, rad, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  // 나무 기둥
  ctx.fillStyle = '#7d6a58'
  ctx.fillRect(W * 0.3, H * 0.62, 26, H * 0.4)
  ctx.filter = 'none'

  // 햇살에 살짝 날아간 느낌
  ctx.fillStyle = 'rgba(255, 252, 244, 0.28)'
  ctx.fillRect(0, 0, W, H)

  const t = new CanvasTexture(canvas)
  t.colorSpace = SRGBColorSpace
  return t
}

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']

/** 큰 종이 벽걸이 달력: 이번 달 이름 + 날짜 그리드, 오늘 날짜에 동그라미 */
export function calendarTexture(date = new Date()) {
  const W = 768
  const H = 1024
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  // 웹폰트가 늦게 오면 한 번 더 그린다
  const draw = () => {
    ctx.fillStyle = '#fbfaf6'
    ctx.fillRect(0, 0, W, H)

    const y = date.getFullYear()
    const m = date.getMonth()
    ctx.fillStyle = '#1f2023'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.font = "600 34px Inter, 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText(String(y), 64, 120)
    ctx.font = "400 96px 'Bodoni Moda', 'Didot', Georgia, serif"
    ctx.fillText(MONTHS[m], 60, 230)
    ctx.font = "600 120px Inter, 'Helvetica Neue', Arial, sans-serif"
    ctx.textAlign = 'right'
    ctx.fillText(String(m + 1).padStart(2, '0'), W - 60, 230)

    // 요일 머리글 + 날짜 칸
    const gx = 60
    const gy = 330
    const cw = (W - 120) / 7
    const ch = 105
    ctx.textAlign = 'center'
    ctx.font = "600 24px Inter, 'Helvetica Neue', Arial, sans-serif"
    ;['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d, i) => {
      ctx.fillStyle = i === 0 ? '#8a8578' : '#1f2023'
      ctx.fillText(d, gx + cw * i + cw / 2, gy)
    })
    ctx.strokeStyle = 'rgba(31, 32, 35, 0.12)'
    ctx.lineWidth = 2
    const first = new Date(y, m, 1).getDay()
    const days = new Date(y, m + 1, 0).getDate()
    ctx.font = "400 38px Inter, 'Helvetica Neue', Arial, sans-serif"
    for (let d = 1; d <= days; d++) {
      const idx = first + d - 1
      const cx = gx + cw * (idx % 7) + cw / 2
      const cy = gy + 40 + ch * Math.floor(idx / 7) + ch / 2
      ctx.beginPath()
      ctx.moveTo(gx + cw * (idx % 7) + 6, cy - ch / 2 + 6)
      ctx.lineTo(gx + cw * (idx % 7) + cw - 6, cy - ch / 2 + 6)
      ctx.stroke()
      ctx.fillStyle = idx % 7 === 0 ? '#8a8578' : '#1f2023'
      ctx.fillText(String(d), cx, cy + 14)
      if (d === date.getDate()) {
        ctx.beginPath()
        ctx.arc(cx, cy, 34, 0, Math.PI * 2)
        ctx.lineWidth = 3
        ctx.strokeStyle = '#1f2023'
        ctx.stroke()
        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgba(31, 32, 35, 0.12)'
      }
    }
  }
  draw()
  const t = new CanvasTexture(canvas)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  document.fonts?.ready.then(() => {
    draw()
    t.needsUpdate = true
  })
  return t
}
