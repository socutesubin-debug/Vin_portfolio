import { useRef } from 'react'
import { gsap, useGSAP } from '../../animations/gsap'
import { PROFILE } from '../../data/profile'
import { useExperience } from '../../state/experienceStore'

const chars = (s: string) =>
  [...s].map((c, i) => (
    <span key={i} className="kinetic__ch">
      {c === ' ' ? ' ' : c}
    </span>
  ))

/**
 * Scene 01 Kinetic Typography. 스크롤 타임라인과 별개로 최초 진입 시 자동 재생된다.
 * PARK SU VIN → (VIN만 남음) → V[ISION ]IN[SIDE] = VISION INSIDE → VIN
 * 글자 구간의 폭을 실제로 접고 펼쳐 단어가 재배열되는 것처럼 보이게 한다(DOM 텍스트).
 * 브랜드 프리롤일 뿐이며, 끝나면 Intro 스크롤 장면(잉크 번짐 → 서랍장 상승)이 이어진다.
 * Skip은 이 프리롤만 건너뛴다. 모델 로딩이 남아 있으면 기다렸다가 사라진다.
 */
export default function IntroTypography() {
  const root = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const introRun = useExperience((s) => s.introRun)
  const reduced = useExperience((s) => s.reducedMotion)
  const modelReady = useExperience((s) => s.modelReady)
  const introDone = useExperience((s) => s.introDone)
  const setIntroDone = useExperience((s) => s.setIntroDone)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      let unsub: (() => void) | null = null

      const reveal = () => {
        gsap.to(root.current, {
          autoAlpha: 0,
          duration: reduced ? 0 : 0.7,
          ease: 'power2.inOut',
          onComplete: () => setIntroDone(true),
        })
      }
      const done = () => {
        if (useExperience.getState().modelReady) return reveal()
        unsub = useExperience.subscribe((s) => {
          if (!s.modelReady) return
          unsub?.()
          unsub = null
          reveal()
        })
      }

      gsap.set(root.current, { autoAlpha: 1 })
      gsap.set(q('.seg-b, .seg-c'), { width: 0, opacity: 0 })
      gsap.set(q('.kinetic__word'), { letterSpacing: '0.02em', scale: 1 })

      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: done })
      if (reduced) {
        // 모션 축소: 최종 로고만 보여주고 바로 넘어간다
        gsap.set(q('.seg-a'), { width: 0, opacity: 0 })
        tl.to({}, { duration: 0.01 })
      } else {
        tl.from(q('.seg-a .kinetic__ch, .seg-v .kinetic__ch, .seg-in .kinetic__ch'), {
          yPercent: 110,
          opacity: 0,
          duration: 0.5,
          stagger: 0.03,
          ease: 'power3.out',
        })
          .to(q('.kinetic__word'), { letterSpacing: '0.12em', duration: 0.4 }, '-=0.15')
          // PARK SU 접힘 → VIN
          .to(q('.seg-a'), { width: 0, opacity: 0, duration: 0.45 })
          .to(q('.kinetic__word'), { letterSpacing: '0.04em', duration: 0.45 }, '<')
          // V + ISION + IN + SIDE 펼침 → VISION INSIDE
          .to(q('.seg-b, .seg-c'), { width: 'auto', opacity: 1, duration: 0.5 })
          .from(q('.seg-b .kinetic__ch, .seg-c .kinetic__ch'), { yPercent: -80, opacity: 0, duration: 0.4, stagger: 0.02 }, '<0.08')
          // 다시 접힘 → VIN 로고
          .to(q('.seg-b, .seg-c'), { width: 0, opacity: 0, duration: 0.45 }, '+=0.3')
          .to(q('.kinetic__word'), { letterSpacing: '0.22em', scale: 1.25, duration: 0.5 }, '<')
          .to({}, { duration: 0.15 })
      }
      tlRef.current = tl

      // 인트로 도중 스크롤하면 즉시 건너뛴다(스크롤을 막지 않는다)
      const onScroll = () => window.scrollY > 8 && tl.progress() < 1 && tl.progress(1)
      window.addEventListener('scroll', onScroll, { passive: true })
      return () => {
        unsub?.()
        window.removeEventListener('scroll', onScroll)
      }
    },
    { scope: root, dependencies: [introRun, reduced], revertOnUpdate: true },
  )

  const skip = () => {
    const tl = tlRef.current
    if (tl && tl.progress() < 1) tl.progress(1)
  }

  return (
    <div ref={root} className="kinetic" aria-hidden={introDone}>
      <h1 className="kinetic__word" aria-label={`${PROFILE.nameEn} — ${PROFILE.meaning} — ${PROFILE.brand}`}>
        <span aria-hidden="true" className="kinetic__line">
          <span className="seg seg-a">{chars('PARK SU ')}</span>
          <span className="seg seg-v">{chars('V')}</span>
          <span className="seg seg-b">{chars('ISION ')}</span>
          <span className="seg seg-in">{chars('IN')}</span>
          <span className="seg seg-c">{chars('SIDE')}</span>
        </span>
      </h1>
      {!modelReady && (
        <p className="kinetic__loading" role="status">
          Loading
        </p>
      )}
      {!introDone && (
        <button type="button" className="kinetic__skip" onClick={skip}>
          Skip intro
        </button>
      )}
    </div>
  )
}
