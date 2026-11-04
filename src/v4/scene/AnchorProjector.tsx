import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { HOTSPOTS, type HotspotId } from '../config/hotspots'

/** HTML 버튼(ui/HotspotButtons)이 등록하는 요소. 3D 위치를 화면 좌표로 옮겨 따라 붙인다 */
export const anchorEls = new Map<HotspotId, HTMLElement>()

const v = new Vector3()

/** Canvas 안에 둔다. 매 프레임 각 오브제 위치를 화면 좌표로 바꿔 버튼을 옮긴다(React 렌더 없이) */
export default function AnchorProjector() {
  useFrame(({ camera, size }) => {
    anchorEls.forEach((el, id) => {
      v.set(...HOTSPOTS[id].anchor).project(camera)
      const behind = v.z > 1
      const x = (v.x * 0.5 + 0.5) * size.width
      const y = (-v.y * 0.5 + 0.5) * size.height
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`
      el.style.visibility = behind ? 'hidden' : ''
    })
  })
  return null
}
