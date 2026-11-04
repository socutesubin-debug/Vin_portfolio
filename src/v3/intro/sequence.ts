import { INTRO_LOADING, INTRO_MEDIA, INTRO_SCROLL } from './introConfig'

export type ClipId = 'c1' | 'c2' | 'c3' | 'c4'
export const CLIP_IDS: ClipId[] = ['c1', 'c2', 'c3', 'c4']

/** npm run build:intro가 만드는 manifest.json */
export interface IntroManifest extends Record<ClipId, [number, number]> {
  total: number
  fps: number
  desktop: { width: number; height: number; path: string }
  mobile: { width: number; height: number; path: string }
  version: string
}

export type Variant = 'desktop' | 'mobile'

export async function loadManifest(): Promise<IntroManifest> {
  // 영상을 바꾸고 다시 빌드하면 manifest도 바뀌므로 캐시를 쓰지 않는다
  const res = await fetch(`${INTRO_MEDIA.base}manifest.json`, { cache: 'no-cache' })
  if (!res.ok) throw new Error('INTRO manifest.json을 불러오지 못했어요. npm run build:intro를 먼저 실행하세요.')
  return res.json()
}

export const pickVariant = (): Variant =>
  window.innerWidth / window.innerHeight < INTRO_LOADING.mobileBelowAspect ? 'mobile' : 'desktop'

export const frameUrl = (m: IntroManifest, v: Variant, n: number) =>
  `${INTRO_MEDIA.base}${m[v].path}${String(n).padStart(4, '0')}.webp?v=${m.version}`

// ── 스크롤 진행률 → 프레임 ─────────────────────────────

interface Segment {
  name: ClipId | 'hold'
  length: number
  from: number
  to: number
}

/**
 * 스크롤 구간: c1(c1 시작 → c2 시작) / c2(→ c3 시작) / hold(c3 시작 고정) / c3(→ c4 시작) / c4(→ 마지막).
 * 이음매 크로스페이드 프레임은 다음 구간에 속한다.
 */
export function buildSegments(m: IntroManifest): Segment[] {
  const s = INTRO_SCROLL
  return [
    { name: 'c1', length: s.c1, from: m.c1[0], to: m.c2[0] },
    { name: 'c2', length: s.c2, from: m.c2[0], to: m.c3[0] },
    { name: 'hold', length: s.hold, from: m.c3[0], to: m.c3[0] },
    { name: 'c3', length: s.c3, from: m.c3[0], to: m.c4[0] },
    { name: 'c4', length: s.c4, from: m.c4[0], to: m.total },
  ]
}

export const totalLength = (segs: Segment[]) => segs.reduce((a, s) => a + s.length, 0)

export interface SeqPoint {
  /** 가장 가까운 프레임 번호(1부터) */
  frame: number
  segment: Segment['name']
  /** 구간 안 진행률(0~1) */
  local: number
}

export function pointAt(segs: Segment[], progress: number): SeqPoint {
  let at = Math.min(1, Math.max(0, progress)) * totalLength(segs)
  for (const [i, s] of segs.entries()) {
    if (at <= s.length || i === segs.length - 1) {
      const local = s.length > 0 ? Math.min(1, at / s.length) : 1
      return { frame: Math.round(s.from + (s.to - s.from) * local), segment: s.name, local }
    }
    at -= s.length
  }
  throw new Error('unreachable')
}

/** 진행률에서 c1~c2 안의 진행률(타이포용, 0~1 밖으로 나갈 수 있음) */
export function typeProgress(segs: Segment[], progress: number) {
  const span = segs[0].length + segs[1].length
  return (progress * totalLength(segs)) / span
}

/** 진행률에서 c4 구간 안의 진행률(빛 효과용) */
export function c4Progress(segs: Segment[], progress: number) {
  const before = totalLength(segs) - segs[segs.length - 1].length
  return Math.max(0, (progress * totalLength(segs) - before) / segs[segs.length - 1].length)
}

/** 프레임 번호가 속한 클립 이름(이음매에서는 앞뒤 둘 다) */
export function clipsAt(m: IntroManifest, frame: number) {
  return CLIP_IDS.filter((id) => frame >= m[id][0] && frame <= m[id][1]).join('+')
}

// ── 프레임 불러오기 ───────────────────────────────────

/**
 * 첫 프레임 → 앞부분(headFrames) → 나머지는 16·8·4·2·1칸 간격으로 점점 촘촘하게 불러온다.
 * 아직 안 불러온 프레임을 요청하면 가장 가까운 불러온 프레임을 돌려준다.
 */
export class FrameLoader {
  readonly images: (HTMLImageElement | null)[]
  loadedCount = 0
  private cancelled = false
  private manifest: IntroManifest
  private variant: Variant
  private onLoad: () => void

  constructor(manifest: IntroManifest, variant: Variant, onLoad: () => void) {
    this.manifest = manifest
    this.variant = variant
    this.images = new Array(manifest.total + 1).fill(null)
    this.onLoad = onLoad
    void this.run()
  }

  private order(): number[] {
    const total = this.manifest.total
    const seen = new Set<number>()
    const out: number[] = []
    const push = (n: number) => {
      if (n >= 1 && n <= total && !seen.has(n)) {
        seen.add(n)
        out.push(n)
      }
    }
    push(1)
    for (let n = 2; n <= Math.min(total, INTRO_LOADING.headFrames); n++) push(n)
    for (const step of [16, 8, 4, 2, 1]) for (let n = 1; n <= total; n += step) push(n)
    push(total)
    return out
  }

  private load(n: number) {
    return new Promise<void>((resolve) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        if (!this.cancelled) {
          this.images[n] = img
          this.loadedCount++
          this.onLoad()
        }
        resolve()
      }
      img.onerror = () => resolve()
      img.src = frameUrl(this.manifest, this.variant, n)
    })
  }

  private async run() {
    const queue = this.order()
    // 첫 프레임은 혼자 먼저
    await this.load(queue.shift()!)
    const worker = async () => {
      while (!this.cancelled && queue.length) await this.load(queue.shift()!)
    }
    await Promise.all(Array.from({ length: INTRO_LOADING.concurrency }, worker))
  }

  /** n번 프레임, 없으면 가장 가까운 불러온 프레임 */
  nearest(n: number): HTMLImageElement | null {
    const imgs = this.images
    if (imgs[n]) return imgs[n]
    for (let d = 1; d < imgs.length; d++) {
      if (imgs[n - d]) return imgs[n - d]
      if (imgs[n + d]) return imgs[n + d]
    }
    return null
  }

  cancel() {
    this.cancelled = true
  }
}

/** canvas를 꽉 채우도록(cover) 그린다 */
export function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const { width: cw, height: ch } = ctx.canvas
  const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
  const w = img.naturalWidth * s
  const h = img.naturalHeight * s
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h)
}
