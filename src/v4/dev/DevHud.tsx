import { useHome } from '../state/homeStore'

/** 개발용: 현재 상태와 임시 에셋 표시. 빌드에서는 빠진다 */
export default function DevHud() {
  const mode = useHome((s) => s.mode)
  const hovered = useHome((s) => s.hovered)
  const lampOn = useHome((s) => s.lampOn)
  return (
    <div className="v4-dev" aria-hidden="true">
      <strong>V4 HOME · 시제품(임시 도형)</strong>
      <span data-testid="v4-mode">{mode}</span>
      <span>hover {hovered ?? '–'} · lamp {lampOn ? 'on' : 'off'}</span>
    </div>
  )
}
