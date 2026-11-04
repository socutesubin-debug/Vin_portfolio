/**
 * INTRO 영상 → 스크롤 재생용 WebP 이미지 시퀀스.
 *
 *   npm run build:intro
 *
 * 입력: public/media/intro/raw/ 의 c1~c4 mp4 (파일 이름이 c1, c2, c3, c4로 시작하면 된다)
 * 출력: public/media/intro/seq/desktop/0001.webp …, seq/mobile/0001.webp …, public/media/intro/manifest.json
 *
 * 영상만 같은 이름(또는 같은 c1~c4 앞머리)으로 바꿔 넣고 다시 돌리면 시퀀스와 manifest가 새로 만들어진다.
 * 해상도는 원본보다 키우지 않는다(480p 테스트 → 가로 864, 720p 최종 → 가로 1280).
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import ffmpegPath from 'ffmpeg-static'

// ── 설정 ──────────────────────────────────────────────
const OPTIONS = {
  clips: ['c1', 'c2', 'c3', 'c4'],
  fps: 24,
  /** 클립 사이 크로스페이드 길이(초). 24fps에서 0.3초 → 7프레임 */
  crossfade: 0.3,
  /** WebP 품질(0~100) */
  quality: 75,
  /** 데스크톱 시퀀스 최대 가로(px). 원본이 더 작으면 원본 크기 그대로 */
  desktopMaxWidth: 1600,
  /** 모바일 시퀀스: 가운데 기준 9:16으로 자른 뒤 최대 가로(px). 원본이 더 작으면 원본 크기 그대로 */
  mobileMaxWidth: 720,
  mobileAspect: 9 / 16,
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const INTRO = join(ROOT, 'public/media/intro')
const RAW = join(INTRO, 'raw')
const SEQ = join(INTRO, 'seq')
const rel = (p) => relative(ROOT, p).replaceAll('\\', '/')

const even = (n) => Math.max(2, Math.floor(n / 2) * 2)

function ffmpeg(args, { quiet = false } = {}) {
  const r = spawnSync(ffmpegPath, ['-hide_banner', ...args], { encoding: 'utf8', maxBuffer: 1 << 26 })
  if (r.status !== 0 && !quiet) {
    console.error(r.stderr)
    throw new Error('ffmpeg 실행 실패')
  }
  return r.stderr
}

/** 클립의 가로·세로와 실제 프레임 수(패킷 수) */
function probe(file) {
  const info = ffmpeg(['-i', file], { quiet: true })
  const size = info.match(/Video:.*?(\d{2,5})x(\d{2,5})/)
  if (!size) throw new Error(`영상 정보를 읽지 못했어요: ${file}`)
  const count = ffmpeg(['-i', file, '-map', '0:v:0', '-c', 'copy', '-f', 'null', '-'])
  const frames = [...count.matchAll(/frame=\s*(\d+)/g)].pop()
  if (!frames) throw new Error(`프레임 수를 세지 못했어요: ${file}`)
  return { width: +size[1], height: +size[2], frames: +frames[1] }
}

// ── 1. 입력 찾기 ──────────────────────────────────────
if (!existsSync(RAW)) throw new Error(`${rel(RAW)} 폴더가 없어요`)
const rawFiles = readdirSync(RAW).filter((f) => f.toLowerCase().endsWith('.mp4'))
const inputs = OPTIONS.clips.map((id) => {
  const name = rawFiles.filter((f) => f.toLowerCase().startsWith(id)).sort()[0]
  if (!name) throw new Error(`${rel(RAW)}에서 ${id}로 시작하는 mp4를 찾지 못했어요`)
  const file = join(RAW, name)
  return { id, name, file, ...probe(file) }
})

const { width: srcW, height: srcH } = inputs[0]
for (const c of inputs) {
  if (c.width !== srcW || c.height !== srcH) {
    throw new Error(`클립 크기가 달라요: ${c.name} ${c.width}x${c.height} (c1은 ${srcW}x${srcH})`)
  }
}

// ── 2. 프레임 번호 계산 ───────────────────────────────
const overlap = Math.round(OPTIONS.crossfade * OPTIONS.fps)
const manifestClips = {}
let start = 1
for (const [i, c] of inputs.entries()) {
  if (c.frames <= overlap * 2) throw new Error(`${c.name}가 너무 짧아요(${c.frames}프레임)`)
  if (i > 0) start -= overlap
  manifestClips[c.id] = [start, start + c.frames - 1]
  start += c.frames
}
const total = start - 1

// ── 3. 크기 ───────────────────────────────────────────
const desktopW = even(Math.min(OPTIONS.desktopMaxWidth, srcW))
const desktopH = even((srcH * desktopW) / srcW)
const cropW = even(srcH * OPTIONS.mobileAspect)
const cropH = even(srcH)
const mobileW = even(Math.min(OPTIONS.mobileMaxWidth, cropW))
const mobileH = even((cropH * mobileW) / cropW)

// ── 4. 이어 붙이기 + 프레임 뽑기 ──────────────────────
const xf = overlap / OPTIONS.fps
const chains = inputs.map((_, i) => `[${i}:v]fps=${OPTIONS.fps},setpts=PTS-STARTPTS,settb=AVTB,format=yuv420p[v${i}]`)
let last = 'v0'
let offset = 0
for (let i = 1; i < inputs.length; i++) {
  offset += (inputs[i - 1].frames - overlap) / OPTIONS.fps
  const out = i === inputs.length - 1 ? 'joined' : `x${i}`
  chains.push(`[${last}][v${i}]xfade=transition=fade:duration=${xf.toFixed(6)}:offset=${offset.toFixed(6)}[${out}]`)
  last = out
}
chains.push(`[joined]split=2[d0][m0]`)
chains.push(`[d0]scale=${desktopW}:${desktopH}:flags=lanczos[desk]`)
chains.push(`[m0]crop=${cropW}:${cropH}:(iw-${cropW})/2:(ih-${cropH})/2,scale=${mobileW}:${mobileH}:flags=lanczos[mob]`)

for (const dir of ['desktop', 'mobile']) {
  rmSync(join(SEQ, dir), { recursive: true, force: true })
  mkdirSync(join(SEQ, dir), { recursive: true })
}

const webp = ['-c:v', 'libwebp', '-quality', String(OPTIONS.quality), '-compression_level', '5', '-start_number', '1']
console.log(`이어 붙이는 중: ${inputs.map((c) => `${c.name}(${c.frames})`).join(' + ')} → ${total}프레임`)
ffmpeg([
  '-y',
  ...inputs.flatMap((c) => ['-i', c.file]),
  '-filter_complex',
  chains.join(';'),
  '-map', '[desk]', '-frames:v', String(total), ...webp, join(SEQ, 'desktop/%04d.webp'),
  '-map', '[mob]', '-frames:v', String(total), ...webp, join(SEQ, 'mobile/%04d.webp'),
])

// ── 5. 확인 + manifest ────────────────────────────────
for (const dir of ['desktop', 'mobile']) {
  const n = readdirSync(join(SEQ, dir)).filter((f) => f.endsWith('.webp')).length
  if (n !== total) throw new Error(`${dir} 프레임 수가 맞지 않아요: ${n} (예상 ${total})`)
}

const manifest = {
  ...manifestClips,
  total,
  fps: OPTIONS.fps,
  crossfadeFrames: overlap,
  desktop: { width: desktopW, height: desktopH, path: 'seq/desktop/' },
  mobile: { width: mobileW, height: mobileH, path: 'seq/mobile/' },
  source: { width: srcW, height: srcH, files: inputs.map((c) => c.name) },
  /** 영상을 바꾼 뒤 브라우저가 예전 프레임을 쓰지 않게 주소 뒤에 붙인다 */
  version: Date.now().toString(36),
}
writeFileSync(join(INTRO, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')

console.log(`데스크톱 ${desktopW}x${desktopH}, 모바일 ${mobileW}x${mobileH}`)
console.log(Object.entries(manifestClips).map(([k, v]) => `${k} ${v[0]}–${v[1]}`).join(' · '))
console.log(`완료: ${rel(join(INTRO, 'manifest.json'))}`)
