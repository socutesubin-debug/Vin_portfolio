import type { ReactNode } from 'react'

/** 모델 로딩 중 표시 */
export function Loading({ label, progress }: { label: string; progress: number | null }) {
  return (
    <div className="v5-loading" role="status">
      <span className="v5-loading-bar" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress ?? 0.15})` }} data-indeterminate={progress === null} />
      </span>
      {label}
    </div>
  )
}

/** WebGL이 없거나 모델을 불러오지 못했을 때: 정적 그림 + 텍스트 링크로 같은 내용에 도착하게 한다 */
export function Fallback({ reason, illustration, children }: { reason: 'webgl' | 'load'; illustration: ReactNode; children: ReactNode }) {
  return (
    <div className="v5-fallback">
      <div className="v5-fallback-art" aria-hidden="true">
        {illustration}
      </div>
      <div className="v5-fallback-copy">
        <p className="v5-note" role="note">
          {reason === 'webgl'
            ? '이 브라우저에서는 3D 장면을 표시할 수 없어 정적 화면으로 보여드려요.'
            : '3D 모델을 불러오지 못해 정적 화면으로 보여드려요.'}
        </p>
        {children}
      </div>
    </div>
  )
}
