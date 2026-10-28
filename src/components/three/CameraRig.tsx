import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, Vector3, type PerspectiveCamera } from 'three'
import { rig } from '../../animations/rig'
import { REQUIRED_VIEW_WIDTH } from '../../animations/stages'

const target = new Vector3()
const pos = new Vector3()
const offset = new Vector3()


/**
 * 타임라인이 갱신한 rig.cam / rig.target을 카메라에 적용한다.
 * 화면 비율에 따라 거리와 프레이밍을 보정해 세로 화면에서도 서랍장 폭이 잘리지 않게 한다.
 */
export default function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera

  useFrame(({ size }) => {
    const aspect = size.width / size.height

    offset.set(rig.cam.x - rig.target.x, rig.cam.y - rig.target.y, rig.cam.z - rig.target.z)
    const dist = offset.length()
    const halfTan = Math.tan(MathUtils.degToRad(camera.fov / 2))
    const viewWidth = 2 * dist * halfTan * aspect
    const k = Math.max(1, REQUIRED_VIEW_WIDTH / viewWidth)

    // 서랍장은 모든 구간에서 화면 중앙에 둔다
    target.set(rig.target.x, rig.target.y, rig.target.z)

    pos.copy(target).addScaledVector(offset, k)

    // 마우스에 따라 카메라가 움직이는 패럴랙스는 두지 않는다(화면이 흔들려 보기 어렵다는 피드백).

    camera.position.copy(pos)
    camera.lookAt(target)
  })
  return null
}
