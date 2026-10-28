import { useEffect, useRef, type ReactNode } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea'

/**
 * 접근 가능한 모달 셸: role=dialog, 초기 포커스, Tab 순환, Escape 닫기, 배경 클릭 닫기.
 * 배경 흐림은 backdrop-filter로 3D 캔버스만 흐리게 하고 내용은 선명하게 유지한다.
 */
export default function Dialog({
  labelledBy,
  onClose,
  className = '',
  children,
}: {
  labelledBy: string
  onClose: () => void
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const el = ref.current!
    const first = el.querySelector<HTMLElement>('[data-autofocus]') ?? el.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      // 프로젝트 상세 페이지가 위에 열려 있으면 그쪽이 키 입력을 처리한다
      if (document.body.dataset.route === 'detail') return
      if (e.key === 'Escape') {
        e.preventDefault()
        closeRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null)
      if (!items.length) return
      const firstItem = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        firstItem.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className={`overlay ${className}`}
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {children}
    </div>
  )
}

export function CloseButton({ onClick, label = '닫기' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="overlay__close" onClick={onClick} aria-label={label} data-autofocus>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </button>
  )
}
