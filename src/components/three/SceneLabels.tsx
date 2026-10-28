// 3D 위치에 붙는 DOM 라벨. Canvas 밖에서 렌더링하고, 렌더 루프가 화면 좌표를 직접 갱신한다.
// (drei Html은 내부 React 루트를 만들어 StrictMode에서 경고가 나므로 사용하지 않는다.)

export const sceneLabels: { ring: HTMLDivElement | null; pickup: HTMLDivElement | null } = {
  ring: null,
  pickup: null,
}

export default function SceneLabels() {
  return (
    <div className="scene-labels" aria-hidden="true">
      <div ref={(el) => void (sceneLabels.ring = el)} className="scene-label ring-label">
        <svg width="46" height="34" viewBox="0 0 46 34" fill="none">
          <path d="M6 30c8-6 12-15 12-26M16 32c8-7 12-17 12-30" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span>띠링, 띠링</span>
      </div>
      <div ref={(el) => void (sceneLabels.pickup = el)} className="scene-label pickup-hint">
        PICK UP TO CONNECT
      </div>
    </div>
  )
}
