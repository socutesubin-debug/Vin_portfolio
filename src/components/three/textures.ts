import { SANS, makeCanvasTexture, spacedText } from '../../utils/canvasTexture'
import { PROFILE } from '../../data/profile'
import type { CanvasTexture } from 'three'

// 텍스처는 한 번만 만들어 재사용한다(Home·Contact 명함이 같은 텍스처를 쓴다).
let cardFront: CanvasTexture | null = null
let resume: CanvasTexture | null = null
const tabs = new Map<string, CanvasTexture>()

export function cardFrontTexture() {
  cardFront ??= makeCanvasTexture(1024, 600, (ctx, w, h) => {
    ctx.fillStyle = '#F4F2EE'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#1D1F26'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `300 112px ${SANS}`
    spacedText(ctx, PROFILE.brand, w / 2, h * 0.44, 26)
    ctx.font = `400 30px ${SANS}`
    spacedText(ctx, PROFILE.nameEn, w / 2, h * 0.62, 14)
  })
  return cardFront
}

/** 이력서 종이(3D 미리보기). 실제 내용이 아닌 시안의 구성(섹션 제목 + 자리 표시 선)만 그린다. */
export function resumeTexture() {
  resume ??= makeCanvasTexture(1200, 900, (ctx, w, h) => {
    ctx.fillStyle = '#F3F2EF'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#23252C'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.font = `400 44px ${SANS}`
    spacedText(ctx, PROFILE.nameEn, w / 2, 110, 14)
    ctx.strokeStyle = '#9A9CA2'
    ctx.lineWidth = 2
    const left = 140
    const right = w - 140
    const sections = [
      { t: 'PROFILE', lines: 4 },
      { t: 'EDUCATION', lines: 2 },
      { t: 'EXPERIENCE', lines: 4 },
      { t: 'SKILLS', lines: 3 },
    ]
    let y = 190
    for (const s of sections) {
      ctx.beginPath()
      ctx.moveTo(left, y)
      ctx.lineTo(right, y)
      ctx.stroke()
      ctx.font = `500 22px ${SANS}`
      ctx.textAlign = 'left'
      ctx.fillStyle = '#3A3C44'
      spacedLeft(ctx, s.t, left, y + 44, 5)
      ctx.strokeStyle = '#B9BBC0'
      for (let i = 0; i < s.lines; i++) {
        const ly = y + 44 + i * 30
        const len = 0.55 + ((i * 37) % 40) / 100
        ctx.beginPath()
        ctx.moveTo(430, ly)
        ctx.lineTo(430 + (right - 430) * len, ly)
        ctx.stroke()
      }
      ctx.strokeStyle = '#9A9CA2'
      y += 70 + s.lines * 30
    }
  })
  return resume
}

export function tabTexture(label: string, active: boolean) {
  const key = `${label}:${active}`
  let t = tabs.get(key)
  if (!t) {
    t = makeCanvasTexture(512, 112, (ctx, w, h) => {
      ctx.fillStyle = active ? '#FFFFFF' : '#E7E2D6'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = active ? '#2E2C8D' : '#2A2B30'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `500 40px ${SANS}`
      spacedText(ctx, label, w / 2, h / 2 + 2, 9)
    })
    tabs.set(key, t)
  }
  return t
}

function spacedLeft(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  for (const ch of text) {
    ctx.fillText(ch, x, y)
    x += ctx.measureText(ch).width + spacing
  }
}
