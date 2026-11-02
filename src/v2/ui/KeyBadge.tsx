import { useEffect, useState } from 'react'
import { useWorkspace } from '../state/workspaceStore'

const TOAST_MS = 2800

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="7" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M11 12h10M17 12v3M20 12v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/**
 * 이스터에그 표시:
 * - 열쇠를 얻으면 화면 왼쪽 아래에 작은 열쇠 아이콘
 * - 열쇠 획득·잠긴 서랍 안내 문구를 화면 위쪽에 잠깐 띄운다
 */
export default function KeyBadge() {
  const hasKey = useWorkspace((s) => s.hasKey)
  const toast = useWorkspace((s) => s.toast)
  const [shownAt, setShownAt] = useState<number | null>(null)

  useEffect(() => {
    if (!toast) return
    setShownAt(toast.at)
    const id = window.setTimeout(() => setShownAt((at) => (at === toast.at ? null : at)), TOAST_MS)
    return () => window.clearTimeout(id)
  }, [toast])

  return (
    <>
      {hasKey && (
        <div className="v2-key" role="img" aria-label="열쇠를 가지고 있어요. 잠긴 서랍을 열 수 있어요" title="잠긴 서랍을 열 수 있어요">
          <KeyIcon />
        </div>
      )}
      <div className="v2-toast" role="status" aria-live="polite">
        {toast && shownAt === toast.at ? <span key={toast.at}>{toast.text}</span> : null}
      </div>
    </>
  )
}
