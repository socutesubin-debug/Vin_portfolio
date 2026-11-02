import { useEffect, useRef } from 'react'
import { liveCamera } from '../scene/CameraRig'
import { useWorkspace } from '../state/workspaceStore'

const fmt = (v: number[]) => `[${v.map((n) => n.toFixed(2)).join(', ')}]`

/**
 * 개발용 카메라 좌표 패널. 표시 형식이 scenes.ts와 같아서 그대로 복사해 붙여 넣을 수 있다.
 * scenes.ts의 SHOW_CAMERA_PANEL로 켜고 끈다.
 */
export default function DevCameraPanel() {
  const ref = useRef<HTMLPreElement>(null)
  const scene = useWorkspace((s) => s.activeScene)
  const hasKey = useWorkspace((s) => s.hasKey)
  const unlocked = useWorkspace((s) => s.unlocked)
  const resetEgg = useWorkspace((s) => s.resetEasterEgg)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (ref.current) {
        const { position, target, fov, aspect, pullBack } = liveCamera
        ref.current.textContent =
          `position: ${fmt(position)}\n` +
          `target:   ${fmt(target)}\n` +
          `fov ${fov.toFixed(1)}° · aspect ${aspect.toFixed(2)}` +
          (pullBack > 1 ? ` · 거리 ×${pullBack.toFixed(2)}` : '')
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <aside className="v2-dev" aria-label="개발용 패널">
      <strong>camera · {scene}</strong>
      <pre ref={ref} />
      {/* 이스터에그 상태 확인·초기화(새로고침하면 열쇠가 다시 머그 밑에 놓인다) */}
      <div className="v2-dev__finish">
        <span>열쇠 {hasKey ? '있음' : '없음'} · 연 서랍 {unlocked.length}</span>
        <button type="button" onClick={resetEgg}>
          초기화
        </button>
      </div>
    </aside>
  )
}
