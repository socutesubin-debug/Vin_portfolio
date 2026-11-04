import { canUseHotspot, HOTSPOTS, type HotspotId } from '../config/hotspots'
import { anchorEls } from '../scene/AnchorProjector'
import { useHome } from '../state/homeStore'

/**
 * 오브제마다 붙는 HTML 버튼. 포인터 반응과 같은 동작을 키보드·스크린리더로 할 수 있다.
 * 평소에는 보이지 않고, 포인터를 올리거나(호버) Tab으로 포커스하면 안내 문구로 나타난다.
 * 마우스는 3D 오브제가 받도록 pointer-events를 끈다(버튼이 오브제를 가려 호버가 끊기지 않게).
 * 위치는 Canvas 안 AnchorProjector가 매 프레임 맞춘다.
 */
export default function HotspotButtons() {
  const mode = useHome((s) => s.mode)
  const hovered = useHome((s) => s.hovered)
  const lampOn = useHome((s) => s.lampOn)
  const { setHover, activate } = useHome.getState()

  return (
    <div className="v4-spots">
      {(Object.keys(HOTSPOTS) as HotspotId[]).map((id) => {
        const def = HOTSPOTS[id]
        const enabled = canUseHotspot(id, mode)
        const hint = id === 'lamp' ? (lampOn ? 'Lamp off' : 'Lamp on') : def.hint
        return (
          <button
            key={id}
            ref={(el) => {
              if (el) anchorEls.set(id, el)
              else anchorEls.delete(id)
            }}
            type="button"
            className="v4-spot"
            data-active={enabled && hovered === id}
            aria-label={def.label}
            aria-pressed={id === 'lamp' ? lampOn : undefined}
            // disabled 대신 aria-disabled: 키보드로 연 뒤에도 포커스가 버튼에 남아 ABOUT을 닫으면 제자리로 돌아온다
            aria-disabled={!enabled}
            onFocus={() => setHover(id)}
            onBlur={() => useHome.getState().hovered === id && setHover(null)}
            onClick={() => activate(id)}
          >
            {hint}
          </button>
        )
      })}
    </div>
  )
}
