import { HOME_LAYOUT as L } from './home'
import { isHomeInteractive, type HomeMode } from '../state/homeStore'

/**
 * 누를 수 있는 오브제 목록. 오브제(3D 모양)와 동작(상태)을 여기서 잇는다.
 * 후속 인터랙션은 id와 동작을 추가하고 3D 쪽을 <Hotspot id="...">로 감싸면 된다.
 */
export type HotspotId = 'crt' | 'lamp' | 'files'

export interface HotspotDef {
  /** 포인터를 올렸을 때 보이는 안내 */
  hint: string
  /** 키보드·스크린리더용 버튼 이름 */
  label: string
  /** 안내·버튼을 띄울 위치(월드 좌표, 오브제 위쪽) */
  anchor: [number, number, number]
  /** 이 오브제를 다룰 수 있는 장면 */
  scene: 'home' | 'work'
}

export const HOTSPOTS: Record<HotspotId, HotspotDef> = {
  // 'crt'는 ABOUT으로 가는 화면(지금은 노트북)
  crt: { hint: 'About me', label: 'About me — 노트북으로 다가가기', anchor: [L.laptop[0], L.laptop[1] + 0.26, L.laptop[2] - 0.04], scene: 'home' },
  lamp: { hint: 'Lamp', label: '스탠드 켜기/끄기', anchor: [L.lamp[0] + 0.2, L.lamp[1] + 0.48, L.lamp[2]], scene: 'home' },
  files: { hint: 'View projects', label: '프로젝트 목록 보기', anchor: [L.cabinet[0], 0.78, -0.12], scene: 'work' },
}

/** 지금 장면에서 이 오브제를 다룰 수 있는가 */
export const canUseHotspot = (id: HotspotId, mode: HomeMode) =>
  HOTSPOTS[id].scene === 'home' ? isHomeInteractive(mode) : mode === 'WORK_FILES'
