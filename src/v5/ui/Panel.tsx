import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { prefersReducedMotion } from '../prefs'

interface PanelProps {
  title: string
  /** 제목 위 작은 머리글 */
  eyebrow?: string
  onClose: () => void
  children: ReactNode
  /** 'side' = 오른쪽(데스크톱)·아래(모바일), 'center' = 가운데 */
  placement?: 'side' | 'center'
}

/**
 * 공통 패널(대화상자). 닫기 버튼·Escape·바깥 막 클릭으로 닫고, 열려 있는 동안 Tab이 패널 안에서만 돈다.
 * 포커스 복귀는 닫힌 뒤 화면 쪽(focusArrival)이 맡는다.
 */
export function Panel({ title, eyebrow, onClose, children, placement = 'side' }: PanelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useRef(`panel-${Math.random().toString(36).slice(2, 8)}`).current

  useLayoutEffect(() => {
    const el = ref.current!
    const card = el.querySelector('.v5-panel-card')
    if (prefersReducedMotion()) return
    // context.revert(): 중간에 정리돼도(StrictMode 이중 실행 등) from 시작값이 남지 않는다
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()
      tl.from(el, { opacity: 0, duration: 0.25, ease: 'power1.out' })
      tl.from(card, { y: 24, opacity: 0, duration: 0.35, ease: 'power3.out' }, 0.05)
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    // 열려 있는 동안 뒤쪽 메뉴·본문은 키보드·스크린리더에서 빠진다
    const behind = [...document.querySelectorAll('.v5-nav, #main')]
    behind.forEach((b) => b.setAttribute('inert', ''))
    return () => behind.forEach((b) => b.removeAttribute('inert'))
  }, [])

  useEffect(() => {
    const el = ref.current!
    el.querySelector<HTMLElement>('[data-screen-title]')?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = [...el.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, [tabindex="0"]')]
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === el.querySelector('[data-screen-title]'))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [onClose])

  // body로 올려 렌더링한다(.v5-stage는 fixed라 자체 쌓임 맥락이 생겨 메뉴 위로 올라갈 수 없다)
  return createPortal(
    <div className="v5-panel" data-placement={placement} ref={ref}>
      <div className="v5-panel-scrim" onClick={onClose} aria-hidden="true" />
      <div className="v5-panel-card" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="v5-panel-head">
          <div>
            {eyebrow && <p className="v5-eyebrow">{eyebrow}</p>}
            <h1 id={titleId} tabIndex={-1} data-screen-title>
              {title}
            </h1>
          </div>
          <button type="button" className="v5-close" onClick={onClose}>
            닫기 <span aria-hidden="true">✕</span>
          </button>
        </div>
        <div className="v5-panel-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
