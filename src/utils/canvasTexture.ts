import { CanvasTexture, SRGBColorSpace } from 'three'

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

/** 2D 캔버스로 그린 텍스처. 웹폰트 로딩이 끝나면 한 번 더 그린다. */
export function makeCanvasTexture(w: number, h: number, draw: Draw) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const redraw = () => {
    ctx.clearRect(0, 0, w, h)
    draw(ctx, w, h)
  }
  redraw()
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
  Promise.all([document.fonts.load('300 32px Inter'), document.fonts.load('400 32px Inter')])
    .then(() => document.fonts.ready)
    .then(() => {
      redraw()
      tex.needsUpdate = true
    })
    .catch(() => {})
  return tex
}

export const SANS = "Inter, 'Helvetica Neue', Arial, sans-serif"

/** letter-spacing을 지원하지 않는 환경을 고려해 글자를 직접 배치한다. */
export function spacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  spacing: number,
) {
  const widths = [...text].map((ch) => ctx.measureText(ch).width)
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1)
  let x = cx - total / 2
  const align = ctx.textAlign
  ctx.textAlign = 'left'
  ;[...text].forEach((ch, i) => {
    ctx.fillText(ch, x, y)
    x += widths[i] + spacing
  })
  ctx.textAlign = align
}
