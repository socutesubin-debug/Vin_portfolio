import { useFrame } from '@react-three/fiber'
import { MathUtils, type PerspectiveCamera } from 'three'
import { camState } from '../animation/cameraTimeline'
import { CAMERA } from '../config/scenes'

/** 개발 패널이 읽는 실제 카메라 값 */
export const liveCamera = { position: [0, 0, 0], target: [0, 0, 0], fov: CAMERA.fov, aspect: 1, pullBack: 1 }

const tanHalf = (deg: number) => Math.tan(MathUtils.degToRad(deg / 2))
const REF_TAN_H = tanHalf(CAMERA.fov) * CAMERA.referenceAspect
const KEEP_TAN_H = tanHalf(CAMERA.fov) * CAMERA.minKeepAspect

/**
 * 가로 화면에서는 기본 화각을 쓰고, 화면이 좁아질수록 세로 화각을 넓혀
 * 기준 비율일 때의 가로 시야를 최대한 유지한다(모바일에서 오브젝트가 잘리지 않게).
 */
export function fovForAspect(aspect: number) {
  if (aspect >= CAMERA.referenceAspect) return CAMERA.fov
  const fov = MathUtils.radToDeg(2 * Math.atan(REF_TAN_H / aspect))
  return Math.min(CAMERA.maxFov, fov)
}

/**
 * 화각이 maxFov에 막혀 minKeepAspect만큼의 가로 시야도 안 나오면, 모자란 만큼 카메라를 target에서 뒤로 뺀다.
 * 1이면 설정값 그대로.
 */
function pullBack(aspect: number, fov: number) {
  return Math.max(1, KEEP_TAN_H / aspect / tanHalf(fov))
}

/** 타임라인이 갱신한 camState를 매 프레임 카메라에 적용한다 */
export default function CameraRig() {
  useFrame(({ camera, size }) => {
    const cam = camera as PerspectiveCamera
    const aspect = size.width / size.height
    const fov = fovForAspect(aspect)
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }

    const { position: p, target: t } = camState
    const k = pullBack(aspect, fov)
    cam.position.set(t.x + (p.x - t.x) * k, t.y + (p.y - t.y) * k, t.z + (p.z - t.z) * k)
    cam.lookAt(t.x, t.y, t.z)

    // 패널에는 scenes.ts에 넣을 설정값(뒤로 빼기 전)을 보여준다
    liveCamera.position = [p.x, p.y, p.z]
    liveCamera.target = [t.x, t.y, t.z]
    liveCamera.fov = fov
    liveCamera.aspect = aspect
    liveCamera.pullBack = k
  })
  return null
}
