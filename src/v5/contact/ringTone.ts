import { isSoundOn } from '../prefs'

/**
 * 짧은 벨소리(WebAudio 합성 — 음원 파일 없음). 소리를 켠 방문자에게만, 벨 한 번마다 호출한다.
 * 전화 받기·화면 이탈 시 stopRing().
 */
let ctx: AudioContext | null = null
const playing = new Set<OscillatorNode>()

export function ringOnce() {
  if (!isSoundOn()) return
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  const t0 = ctx.currentTime
  const gain = ctx.createGain()
  gain.connect(ctx.destination)
  // 0.7초 동안 25Hz로 떨리는 두 음(440·480Hz), 음량은 작게
  gain.gain.setValueAtTime(0, t0)
  for (let i = 0; i < 18; i++) {
    const t = t0 + i * 0.04
    gain.gain.setValueAtTime(i % 2 ? 0.015 : 0.06, t)
  }
  gain.gain.setValueAtTime(0, t0 + 0.72)
  for (const f of [440, 480]) {
    const o = ctx.createOscillator()
    o.frequency.value = f
    o.connect(gain)
    o.start(t0)
    o.stop(t0 + 0.75)
    playing.add(o)
    o.onended = () => playing.delete(o)
  }
}

export function stopRing() {
  playing.forEach((o) => {
    try {
      o.stop()
    } catch {
      /* 이미 멈춤 */
    }
  })
  playing.clear()
}
