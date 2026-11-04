import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Vector3, type PerspectiveCamera } from 'three'
import { CAMERA } from '../../v2/config/scenes'
import { fovForAspect } from '../../v2/scene/CameraRig'
import {
  ABOUT_SHOT,
  CABINET,
  ABOUT_SHOT_PORTRAIT,
  DEV_VIEWS,
  FILES_SHOT,
  FILES_SHOT_PORTRAIT,
  HOME_SHOT,
  HOME_SHOT_PORTRAIT,
  POINTER_CAMERA as PC,
  TRANSITION,
  WORK_SHOT,
  WORK_SHOT_PORTRAIT,
  type Shot,
} from '../config/home'
import { isHomeInteractive, isTransition, useHome, type HomeMode } from '../state/homeStore'
import { canHover, pointer, prefersReducedMotion, trackPointer } from './pointer'

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const tanHalf = (deg: number) => Math.tan(MathUtils.degToRad(deg / 2))

/** 장면의 화각: 화면 비율에 맞춘 기본 화각을 장면 화각(shot.fov) 비율만큼 좁힌다 */
function fovFor(shot: Shot, aspect: number) {
  const base = fovForAspect(aspect)
  if (!shot.fov || aspect < 1) return base
  return MathUtils.radToDeg(2 * Math.atan((tanHalf(base) * tanHalf(shot.fov)) / tanHalf(CAMERA.fov)))
}

type ShotKey = 'home' | 'about' | 'work' | 'files'
const SHOTS: Record<ShotKey, [Shot, Shot]> = {
  home: [HOME_SHOT, HOME_SHOT_PORTRAIT],
  about: [ABOUT_SHOT, ABOUT_SHOT_PORTRAIT],
  work: [WORK_SHOT, WORK_SHOT_PORTRAIT],
  files: [FILES_SHOT, FILES_SHOT_PORTRAIT],
}

/** 상태마다 카메라가 머무는(또는 향하는) 구도. 프로젝트 목록은 서랍장 정면을 흐리게 깔아 둔다 */
const SHOT_OF: Record<HomeMode, ShotKey> = {
  HOME_IDLE: 'home',
  OBJECT_HOVER: 'home',
  RETURN_HOME: 'home',
  CAMERA_TRANSITION: 'about',
  ABOUT_OPEN: 'about',
  WORK_TRANSITION: 'work',
  WORK_OPENING: 'files',
  WORK_FILES: 'files',
  WORK_LIST: 'work',
}

/** 그 상태로 들어갈 때 카메라 이동 시간(초) */
function durationOf(mode: HomeMode) {
  if (mode === 'CAMERA_TRANSITION') return TRANSITION.approachSec
  if (mode === 'RETURN_HOME') return TRANSITION.returnSec
  if (mode === 'WORK_TRANSITION') return TRANSITION.descendSec
  if (mode === 'WORK_OPENING') return TRANSITION.drawerSec
  return TRANSITION.listSec
}

/** 개발용 고정 시점(?view=work 등) */
const devView = import.meta.env.DEV ? DEV_VIEWS[new URLSearchParams(location.search).get('view') ?? ''] : undefined

interface Tween {
  fromP: Vector3
  fromT: Vector3
  fromFov: number
  elapsed: number
  duration: number
  /** 이동 중간에 살짝 띄우는 높이 */
  arc: number
}

/**
 * HOME 카메라. 상태마다 정해진 구도(SHOT_OF)로 이동하고, 머무는 동안은 포인터만큼 작게 따라 움직인다(감쇠 보간).
 * - 상태가 바뀌어 구도가 달라지면 지금 자리에서 새 구도로 이동한다. 전환 상태면 도착할 때 transitionDone
 * - HOME → WORK: 같은 정면에서 그대로 아래로 내려가 서랍장 앞(WORK_TRANSITION) → 서랍 안을 내려다봄(WORK_OPENING)
 * - 자유 회전·오비트 없음
 */
export default function HomeCameraRig() {
  const offset = useRef({ x: 0, y: 0 })
  const tween = useRef<Tween | null>(null)
  const lastMode = useRef<HomeMode>(useHome.getState().mode)
  const pos = useRef(new Vector3())
  const tgt = useRef(new Vector3())
  const fov = useRef(CAMERA.fov)
  const env = useRef({ hover: true, reduced: false })

  useEffect(() => {
    const off = trackPointer()
    const mqs = [window.matchMedia('(hover: hover) and (pointer: fine)'), window.matchMedia('(prefers-reduced-motion: reduce)')]
    const sync = () => {
      env.current = { hover: canHover(), reduced: prefersReducedMotion() }
    }
    sync()
    mqs.forEach((m) => m.addEventListener('change', sync))
    return () => {
      off()
      mqs.forEach((m) => m.removeEventListener('change', sync))
    }
  }, [])

  useFrame(({ camera, size }, rawDt) => {
    const cam = camera as PerspectiveCamera
    const dt = Math.min(rawDt, 0.1)
    const aspect = size.width / size.height
    const { reduced, hover } = env.current
    const mode = useHome.getState().mode
    const shotOf = (m: HomeMode) => SHOTS[SHOT_OF[m]][aspect < 1 ? 1 : 0]
    const shot = shotOf(mode)

    // 구도가 바뀌면 지금 카메라 자리에서 출발한다(포인터로 비켜 있던 만큼도 이어서)
    if (mode !== lastMode.current) {
      const prev = lastMode.current
      lastMode.current = mode
      if (SHOT_OF[prev] !== SHOT_OF[mode] || isTransition(mode)) {
        const aboutMove = SHOT_OF[prev] === 'about' || SHOT_OF[mode] === 'about'
        tween.current = {
          fromP: pos.current.clone(),
          fromT: tgt.current.clone(),
          fromFov: fov.current,
          // 서랍이 열리는 장면은 닫힌 정면을 잠깐 보여 준 뒤 움직인다
          elapsed: mode === 'WORK_OPENING' && !reduced ? -CABINET.openDelay : 0,
          duration: reduced ? TRANSITION.reducedSec : durationOf(mode),
          arc: aboutMove ? TRANSITION.arc : 0,
        }
        // 장면이 바뀌면 포인터 이동은 0에서 다시 부드럽게 따라온다
        offset.current = { x: 0, y: 0 }
      }
    }

    /** 기준 구도 + 포인터 이동 */
    const follow = (s: Shot, range: typeof PC.about) => {
      const scale = reduced ? PC.reducedScale : 1
      const on = hover && pointer.inside && scale > 0 && mode !== 'WORK_LIST'
      const o = offset.current
      const lambda = on ? PC.damping : PC.returnDamping
      o.x = MathUtils.damp(o.x, on ? pointer.x * scale : 0, lambda, dt)
      o.y = MathUtils.damp(o.y, on ? pointer.y * scale : 0, lambda, dt)
      const [px, py, pz] = s.position
      const [tx, ty, tz] = s.target
      pos.current.set(px + o.x * range.position.x, py + o.y * range.position.y, pz)
      tgt.current.set(tx + o.x * range.target.x, ty + o.y * range.target.y, tz)
      fov.current = fovFor(s, aspect)
    }

    const tw = tween.current
    if (devView) {
      pos.current.set(...devView.position)
      tgt.current.set(...devView.target)
      fov.current = fovFor(devView, aspect)
    } else if (tw) {
      tw.elapsed += dt
      const k = tw.duration > 0 ? easeInOut(MathUtils.clamp(tw.elapsed / tw.duration, 0, 1)) : 1
      pos.current.lerpVectors(tw.fromP, new Vector3(...shot.position), k)
      pos.current.y += Math.sin(Math.PI * k) * tw.arc
      tgt.current.lerpVectors(tw.fromT, new Vector3(...shot.target), k)
      fov.current = MathUtils.lerp(tw.fromFov, fovFor(shot, aspect), k)
      if (k >= 1) {
        tween.current = null
        if (isTransition(mode)) useHome.getState().transitionDone()
      }
    } else if (isTransition(mode)) {
      // 같은 구도로 이어지는 전환(이동할 거리가 없을 때)은 바로 끝낸다
      useHome.getState().transitionDone()
    } else {
      follow(shot, isHomeInteractive(mode) ? PC : PC.about)
    }

    if (Math.abs(cam.fov - fov.current) > 0.001) {
      cam.fov = fov.current
      cam.updateProjectionMatrix()
    }
    cam.position.copy(pos.current)
    cam.lookAt(tgt.current)
  })

  return null
}
