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
    <aside className="v2-dev" aria-hidden="true">
      <strong>camera · {scene}</strong>
      <pre ref={ref} />
    </aside>
  )
}
