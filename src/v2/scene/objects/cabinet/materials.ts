import { DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, BackSide } from 'three'
import { makeCanvasTexture, spacedText, SANS } from '../../../../utils/canvasTexture'
import { CABINET_FINISHES, DEFAULT_CABINET_FINISH, type CabinetFinish } from '../../../config/cabinet'

/** 서랍장 몸체·안쪽 재질. 여러 메시가 같이 쓰고, 마감(실버/차콜)을 바꾸면 값만 갈아 끼운다 */
export const paint = new MeshPhysicalMaterial({ clearcoatRoughness: 0.2 })
export const paintIn = new MeshStandardMaterial()

export function applyCabinetFinish(finish: CabinetFinish) {
  const { body, inside } = CABINET_FINISHES[finish]
  paint.color.set(body.color)
  paint.metalness = body.metalness
  paint.roughness = body.roughness
  paint.clearcoat = body.clearcoat
  paintIn.color.set(inside.color)
  paintIn.metalness = inside.metalness
  paintIn.roughness = inside.roughness
}
applyCabinetFinish(DEFAULT_CABINET_FINISH)
export const chrome = new MeshStandardMaterial({ color: '#ffffff', metalness: 1, roughness: 0.12, envMapIntensity: 2 })
export const chromeDouble = chrome.clone()
chromeDouble.side = DoubleSide
export const cupInner = new MeshStandardMaterial({ color: '#6d7079', metalness: 1, roughness: 0.35, side: BackSide })

const KO_SANS = `${SANS}, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif`

/** 글자가 주어진 폭에 들어가도록 글꼴 크기를 줄인다 */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxW: number) {
  let s = size
  do {
    ctx.font = `${weight} ${s}px ${KO_SANS}`
    if (ctx.measureText(text).width <= maxW) break
    s -= 2
  } while (s > 10)
  return s
}

/** 서랍 앞 라벨 카드 */
export function labelTexture(text: string) {
  return makeCanvasTexture(512, 200, (ctx, w, h) => {
    ctx.fillStyle = '#f7f5f0'
    ctx.fillRect(0, 0, w, h)
    if (!text) return
    ctx.fillStyle = '#2a2a30'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    fitFont(ctx, text, 300, 92, w * 0.8)
    spacedText(ctx, text, w / 2, h / 2 + 4, 18)
  })
}

/** 인덱스 카드 탭: 위쪽에 카테고리 색 띠, 프로젝트 이름(크게) + 연도 */
export function cardTabTexture(name: string, year: string, color: string) {
  return makeCanvasTexture(512, 176, (ctx, w, h) => {
    ctx.fillStyle = '#f6f2e9'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = color
    ctx.fillRect(0, 0, w, 14)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#1d1d22'
    fitFont(ctx, name, 600, 60, w * 0.9)
    ctx.fillText(name, w / 2, h * 0.44)
    ctx.fillStyle = '#6a6a72'
    ctx.font = `400 38px ${KO_SANS}`
    ctx.fillText(year, w / 2, h * 0.78)
  })
}

/** 칸막이 인덱스 탭 */
export function tabTexture(text: string, color: string) {
  return makeCanvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#1d1d22'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    fitFont(ctx, text, 500, 64, w * 0.88)
    ctx.fillText(text, w / 2, h / 2 + 3)
  })
}
