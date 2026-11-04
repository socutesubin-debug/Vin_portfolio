import { makeCanvasTexture, SANS } from '../../../utils/canvasTexture'

/**
 * 켜진 화면(기준 이미지): 남색 바탕, 왼쪽 위 주황 글줄, 가운데 VIN과 붉은 가로선, 오른쪽 아래 무지개 호.
 * crt면 주사선·가장자리 어둡게(브라운관)를 더하고, 아니면 깨끗한 LCD 화면.
 */
export function vinScreenTexture({ width = 800, height = 600, crt = true } = {}) {
  return makeCanvasTexture(width, height, (ctx, W, H) => {
    ctx.fillStyle = '#1e3b62'
    ctx.fillRect(0, 0, W, H)
    // 가장자리 얇은 청록 테두리(화면 끝)
    ctx.strokeStyle = 'rgba(120, 200, 210, 0.35)'
    ctx.lineWidth = 3
    ctx.strokeRect(W * 0.025, H * 0.03, W * 0.95, H * 0.94)
    // 무지개 호
    const cx = W * 0.985
    const cy = H * 1.0
    ;['#df4b27', '#ee7d26', '#f3a233', '#f6c64a'].forEach((c, i) => {
      ctx.fillStyle = c
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, H * (0.58 - i * 0.1), Math.PI, Math.PI * 1.5)
      ctx.closePath()
      ctx.fill()
    })
    ctx.fillStyle = '#1e3b62'
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, H * 0.17, Math.PI, Math.PI * 1.5)
    ctx.closePath()
    ctx.fill()
    // 붉은 가로선과 표식
    ctx.fillStyle = '#e2552d'
    ctx.fillRect(W * 0.03, H * 0.515, W * 0.9, 4)
    ctx.fillRect(W * 0.31, H * 0.42, 4, H * 0.1)
    ctx.fillRect(W * 0.31, H * 0.04, 3, H * 0.12)
    // 왼쪽 위 글줄
    ctx.font = `600 17px ${SANS}`
    ctx.fillStyle = 'rgba(232, 96, 52, 0.95)'
    ;['SYS 01 ▸ READY', 'MEM 640K OK', 'VISION INSIDE', '> LOAD ABOUT'].forEach((t, i) => ctx.fillText(t, W * 0.06, H * (0.1 + i * 0.05)))
    // VIN
    ctx.fillStyle = '#f4f1ea'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(255, 255, 255, 0.45)'
    ctx.shadowBlur = 10
    ctx.font = `600 92px ${SANS}`
    ctx.fillText('VIN', W * 0.5, H * 0.47)
    ctx.shadowBlur = 0
    // 아래 프롬프트(커서는 따로 깜빡인다)
    ctx.textAlign = 'left'
    ctx.font = `500 22px ui-monospace, Consolas, monospace`
    ctx.fillStyle = 'rgba(244, 241, 234, 0.8)'
    ctx.fillText('C:\\VIN> about', W * 0.06, H * 0.86)
    if (!crt) return
    // 주사선
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)'
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1.2)
    // 가장자리 어둡게(브라운관 비네트)
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.62)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,0.42)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  })
}
