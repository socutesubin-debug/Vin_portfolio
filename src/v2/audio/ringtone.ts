import { RING } from '../config/contact'

/**
 * 합성 전화벨(음원 파일 없음). 두 음(440Hz + 480Hz)을 빠르게 떨리게 해 옛 전화벨처럼 들리게 한다.
 * 브라우저는 사용자 동작 없이는 소리를 못 내므로, 사운드 켜기 버튼을 누를 때 unlock()으로 깨운다.
 */

let ctx: AudioContext | null = null
let active: { stop: () => void } | null = null

export function unlockAudio() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
  }
}

/** 울림 시작 후 elapsed초가 지난 시점부터 남은 울림을 재생한다 */
export function playRing(elapsed: number) {
  stopRing()
  if (!ctx || ctx.state !== 'running') return
  const c = ctx
  const out = c.createGain()
  out.gain.value = 0.12
  out.connect(c.destination)

  // 떨림(약 20Hz)
  const trem = c.createOscillator()
  trem.frequency.value = 20
  const tremDepth = c.createGain()
  tremDepth.gain.value = 0.5
  trem.connect(tremDepth)
  const env = c.createGain()
  env.gain.value = 0
  tremDepth.connect(env.gain)
  env.connect(out)

  const oscs = [440, 480].map((f) => {
    const o = c.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    o.connect(env)
    return o
  })

  // 남은 구간마다 소리를 켰다 끈다
  const now = c.currentTime
  const total = RING.cycles * RING.period
  for (let k = 0; k < RING.cycles; k++)
    for (const [a, b] of RING.bursts) {
      const s = k * RING.period + a - elapsed
      const e = k * RING.period + b - elapsed
      if (e <= 0) continue
      const t0 = now + Math.max(0, s)
      env.gain.setValueAtTime(0.5, t0)
      env.gain.setValueAtTime(0, now + e)
    }

  const end = now + Math.max(0, total - elapsed) + 0.1
  oscs.forEach((o) => {
    o.start(now)
    o.stop(end)
  })
  trem.start(now)
  trem.stop(end)

  active = {
    stop: () => {
      try {
        out.gain.cancelScheduledValues(c.currentTime)
        out.gain.setValueAtTime(0, c.currentTime)
        oscs.forEach((o) => o.stop())
        trem.stop()
      } catch {
        // 이미 멈춘 경우
      }
      out.disconnect()
    },
  }
}

export function stopRing() {
  active?.stop()
  active = null
}
