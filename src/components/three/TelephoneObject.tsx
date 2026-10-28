import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import {
  CatmullRomCurve3,
  Euler,
  MathUtils,
  Matrix4,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Quaternion,
  TubeGeometry,
  Vector3,
  type Camera,
  type Group,
  type Mesh,
  type Object3D,
  type PerspectiveCamera,
} from 'three'
import { gsap } from '../../animations/gsap'
import { rig } from '../../animations/rig'
import { callAudio } from '../../audio/callAudio'
import { useExperience } from '../../state/experienceStore'
import { trayAnchor } from './Cabinet'
import BusinessCardObject from './BusinessCardObject'
import { useObjectInteraction } from './interaction'
import { sceneLabels } from './SceneLabels'

const tmp = new Vector3()
/** 3D 앵커의 화면 좌표로 DOM 라벨을 옮긴다. */
function place(el: HTMLElement, anchor: Object3D, camera: Camera, w: number, h: number) {
  anchor.getWorldPosition(tmp).project(camera)
  el.style.transform = `translate(-50%, -50%) translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px)`
}

const ID = 'handset'
const bakelite = new MeshPhysicalMaterial({ color: '#0E0F12', roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.18 })
const chrome = new MeshStandardMaterial({ color: '#C9CCD2', roughness: 0.22, metalness: 1 })
const cream = new MeshStandardMaterial({ color: '#E9DFC7', roughness: 0.6 })

// 벨이 울리는 주기(초): RING 동안 울리고 나머지는 쉰다
const PERIOD = 2.4
const RING = 0.9

function ringEnvelope(t: number) {
  const p = t % PERIOD
  return p < RING ? Math.sin((p / RING) * Math.PI) : 0
}

// 수화기 자리(받침 위)와 픽업 포즈. 픽업 t: 0 = 받침 위, 1 = 화면 왼쪽에서 귀에 댄 상태
const HANDSET_REST = new Vector3(0, 0.205, -0.04)
const CORD_ANCHOR = new Vector3(-0.2, -0.005, 0.02) // 수화기 로컬 기준 코드 연결점(왼쪽 귀 부분 = 송화구 쪽)

// 귀에 댄 포즈는 카메라 기준으로 정한다(화면 왼쪽, 길이 방향이 세로, 컵이 사용자 쪽을 향함).
// 수화기 로컬 축: X(길이) → 카메라 위, Y(컵이 열린 방향) → 카메라 안쪽(-Z), Z → 카메라 왼쪽
const earQuat = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(new Vector3(0, 1, 0), new Vector3(0, 0, -1), new Vector3(-1, 0, 0)))
const tiltQuat = new Quaternion().setFromEuler(new Euler(0.05, 0.4, 0.22)) // 살짝 기울여 손에 쥔 느낌
const fwd = new Vector3()
const right = new Vector3()
const up = new Vector3()
const ONE = new Vector3(1, 1, 1)
const mRest = new Matrix4()
const mWorld = new Matrix4()
const mLocal = new Matrix4()
const restPos = new Vector3()
const restQuat = new Quaternion()
const restScale = new Vector3()
const earPos = new Vector3()
const earRot = new Quaternion()
const wPos = new Vector3()
const wQuat = new Quaternion()

/** 현재 카메라와 화면 비율에 맞춘 '귀 옆' 포즈(월드 좌표) */
function earPose(camera: PerspectiveCamera, aspect: number) {
  const q = camera.quaternion
  fwd.set(0, 0, -1).applyQuaternion(q)
  right.set(1, 0, 0).applyQuaternion(q)
  up.set(0, 1, 0).applyQuaternion(q)
  const portrait = aspect < 1
  const d = portrait ? 2.5 : 1.9
  const halfH = Math.tan(MathUtils.degToRad(camera.fov / 2)) * d
  const halfW = halfH * aspect
  const x = portrait ? -0.42 * halfW : -0.56 * halfW
  const y = portrait ? 0.42 * halfH : -0.02 * halfH
  earPos.copy(camera.position).addScaledVector(fwd, d).addScaledVector(right, x).addScaledVector(up, y)
  earRot.copy(q).multiply(tiltQuat).multiply(earQuat)
}

/** 코드 끝점(전화기 그룹 좌표): 수화기 로컬 변환(L)을 코드 연결점에 적용한다 */
function cordEnd(L: Matrix4, out: Vector3) {
  return out.copy(CORD_ANCHOR).applyMatrix4(L).add(HANDSET_REST)
}

/** 본체 왼쪽 → 수화기로 이어지는 꼬인 코드. 수화기가 멀어질수록 중간 처짐을 줄여 팽팽하게 이어 준다. */
function buildCord(end: Vector3, t: number) {
  const start = new Vector3(-0.17, 0.05, 0.02)
  const taut = Math.min(1, t) * 0.8
  const mid1 = new Vector3(-0.32, 0.01, 0.18).lerp(start.clone().lerp(end, 0.33), taut)
  const mid2 = new Vector3(-0.38, 0.01, -0.06).lerp(start.clone().lerp(end, 0.66), taut)
  mid1.y -= 0.1 * taut
  mid2.y -= 0.1 * taut
  const path = new CatmullRomCurve3([start, mid1, mid2, end])
  const N = 220
  const coils = 34
  const pts: Vector3[] = []
  for (let i = 0; i <= N; i++) {
    const u = i / N
    const p = path.getPoint(u)
    const a = u * coils * Math.PI * 2
    p.x += Math.cos(a) * 0.012
    p.y += Math.sin(a) * 0.012
    pts.push(p)
  }
  return new TubeGeometry(new CatmullRomCurve3(pts), 300, 0.0045, 6, false)
}

const isTouchOnly = () => window.matchMedia('(hover: none)').matches

/**
 * 셋째 서랍(Contact)의 다이얼 전화기.
 * 통화 흐름: ringing(수화기 진동) → 클릭 → pickingUp(수화기가 받침에서 분리되어 올라감) → connected(연락처 오버레이)
 *          → HANG UP/Escape → hangingUp(수화기가 받침으로 복귀) → ringing
 * 수화기 Transform은 부모/자식 그룹으로 소유권을 나눈다:
 *   rest(고정 자리) > ring(벨 진동·hover, useFrame) > lift(픽업, GSAP). 스크롤 타임라인은 서랍만 움직인다.
 * 벨은 소리 없이 진동과 텍스트로만 표현한다(오디오는 audio/callAudio.ts 확장 지점).
 */
export default function TelephoneObject() {
  const ringG = useRef<Group>(null)
  const liftG = useRef<Group>(null)
  const cordMesh = useRef<Mesh>(null)
  const ringAnchor = useRef<Group>(null)
  const pickupAnchor = useRef<Group>(null)
  const cardGroup = useRef<Group>(null)
  const lift = useRef({ t: 0, built: 0 }).current
  const hoverY = useRef(0)
  const reduced = useExperience((s) => s.reducedMotion)
  const initialCord = useMemo(() => buildCord(cordEnd(new Matrix4(), new Vector3()), 0), [])
  const handlers = useObjectInteraction(
    ID,
    () => rig.contact > 0.9 && useExperience.getState().call === 'ringing',
    () => useExperience.getState().setCall('pickingUp'),
  )

  // 통화 상태 전이에 맞춰 수화기를 GSAP으로 올리고 내린다
  useEffect(() => {
    const unsub = useExperience.subscribe((s, prev) => {
      if (s.call === prev.call) return
      if (s.call === 'ringing') callAudio.startRing()
      else if (prev.call === 'ringing') callAudio.stopRing()

      if (s.call === 'pickingUp') {
        gsap.to(lift, {
          t: 1,
          duration: reduced ? 0 : 0.95,
          ease: 'power2.inOut',
          overwrite: true,
          onComplete: () => {
            const st = useExperience.getState()
            if (st.call !== 'pickingUp') return
            st.setCall('connected')
            st.openFocus({ type: 'call' }, null, document.querySelector('[data-opener="call"]'))
          },
        })
      } else if (s.call === 'hangingUp') {
        gsap.to(lift, {
          t: 0,
          duration: reduced ? 0 : 0.85,
          ease: 'power2.inOut',
          overwrite: true,
          onComplete: () => {
            if (useExperience.getState().call === 'hangingUp') useExperience.getState().setCall('ringing')
          },
        })
      } else if (s.call === 'idle') {
        gsap.killTweensOf(lift)
        lift.t = 0
      }
    })
    return () => {
      unsub()
      gsap.killTweensOf(lift)
      callAudio.stopRing()
    }
  }, [lift, reduced])

  useEffect(
    () => () => {
      cordMesh.current?.geometry.dispose()
    },
    [],
  )

  useFrame(({ clock, camera, size }, dt) => {
    let s = useExperience.getState()
    const open = rig.contact > 0.95

    // 서랍이 열리면 벨이 울리기 시작하고, 서랍에서 벗어나면 통화/UI를 안전하게 초기화한다
    if (s.call === 'idle' && open) s.setCall('ringing')
    else if (s.call === 'ringing' && rig.contact < 0.9) s.setCall('idle')
    else if (s.call !== 'idle' && s.call !== 'ringing' && rig.contact < 0.5) {
      gsap.killTweensOf(lift)
      lift.t = 0
      if (s.focus.type === 'call') s.closeFocus()
      useExperience.setState({ call: 'idle' })
    }
    s = useExperience.getState()

    const ringing = s.call === 'ringing' && s.focus.type === 'none'
    const env = ringing && !s.reducedMotion ? ringEnvelope(clock.elapsedTime) : 0
    const hovered = ringing && s.hovered === ID

    // 벨 진동(좌우 흔들림 + 아주 작은 회전)과 hover 상승 — 전화기 본체는 움직이지 않는다
    if (ringG.current) {
      const w = clock.elapsedTime * 55
      hoverY.current = s.reducedMotion ? (hovered ? 0.025 : 0) : MathUtils.damp(hoverY.current, hovered ? 0.025 : 0, 12, dt)
      ringG.current.rotation.z = Math.sin(w) * 0.03 * env
      ringG.current.rotation.x = Math.sin(w * 0.83 + 1) * 0.012 * env
      ringG.current.position.x = Math.sin(w + 1.3) * 0.004 * env
      ringG.current.position.y = hoverY.current + Math.abs(Math.sin(w)) * 0.006 * env
    }

    // 픽업: lift.t(GSAP)만큼 받침 위 포즈 → 화면 왼쪽 '귀 옆' 포즈로 월드 공간에서 보간하고,
    // 부모 좌표로 환산해 lift 그룹에 적용한다. 코드는 끝점이 따라오도록 다시 만든다.
    const lg = liftG.current
    if (lg?.parent) {
      const t = lift.t
      if (t > 0.0001) {
        lg.parent.updateWorldMatrix(true, false)
        mRest.copy(lg.parent.matrixWorld)
        mRest.decompose(restPos, restQuat, restScale)
        earPose(camera as PerspectiveCamera, size.width / size.height)
        wPos.lerpVectors(restPos, earPos, t)
        wQuat.slerpQuaternions(restQuat, earRot, t)
        mWorld.compose(wPos, wQuat, ONE)
        mLocal.copy(mRest).invert().multiply(mWorld)
        mLocal.decompose(lg.position, lg.quaternion, lg.scale)
      } else {
        lg.position.set(0, 0, 0)
        lg.quaternion.identity()
        lg.scale.set(1, 1, 1)
        mLocal.identity()
      }
      if (cordMesh.current && (Math.abs(t - lift.built) > 0.002 || (t > 0.0001 && s.focus.type === 'none'))) {
        cordMesh.current.geometry.dispose()
        cordMesh.current.geometry = buildCord(cordEnd(mLocal, new Vector3()), t)
        lift.built = t
      }
    }

    // 장면 위 라벨(DOM): 띠링 텍스트는 진동 리듬과 맞춘다
    const ring = sceneLabels.ring
    if (ring && ringAnchor.current) {
      const show = s.call === 'ringing' && s.focus.type === 'none'
      ring.style.opacity = String(show ? (s.reducedMotion ? 1 : 0.25 + env * 0.75) : 0)
      if (show) place(ring, ringAnchor.current, camera, size.width, size.height)
    }
    const pickup = sceneLabels.pickup
    if (pickup && pickupAnchor.current) {
      // 마우스 환경에서는 hover 시, 터치 환경에서는 항상 표시(탭으로 실행)
      const show = ringing && (hovered || isTouchOnly())
      pickup.style.opacity = show ? '1' : '0'
      if (show) place(pickup, pickupAnchor.current, camera, size.width, size.height)
    }
    if (cardGroup.current) {
      const c = rig.contactCard
      cardGroup.current.visible = c > 0.01
      cardGroup.current.position.z = 0.1 - (1 - c) * 0.25
      cardGroup.current.scale.setScalar(0.6 + c * 0.4)
    }
  })

  const [x, y, z] = trayAnchor('contact')
  return (
    <group position={[x, y + 0.005, z]}>
      <group position={[-0.05, 0, 0.02]}>
        {/* 본체 */}
        <RoundedBox args={[0.34, 0.11, 0.3]} radius={0.035} smoothness={4} position={[0, 0.055, 0]} material={bakelite} castShadow />
        <RoundedBox args={[0.27, 0.08, 0.2]} radius={0.03} smoothness={4} position={[0, 0.13, -0.02]} rotation={[-0.3, 0, 0]} material={bakelite} castShadow />
        {/* 다이얼 */}
        <group position={[0, 0.125, 0.105]} rotation={[-1.1, 0, 0]}>
          <mesh material={chrome}>
            <cylinderGeometry args={[0.085, 0.085, 0.008, 48]} />
          </mesh>
          <mesh material={cream} position={[0, 0.005, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.006, 32]} />
          </mesh>
          {Array.from({ length: 10 }, (_, i) => {
            const a = -0.5 + i * 0.5
            return (
              <mesh key={i} material={bakelite} position={[Math.cos(a) * 0.062, 0.005, Math.sin(a) * 0.062]}>
                <cylinderGeometry args={[0.012, 0.012, 0.006, 16]} />
              </mesh>
            )
          })}
        </group>
        {/* 받침 */}
        {[-0.09, 0.09].map((hx) => (
          <mesh key={hx} material={bakelite} position={[hx, 0.18, -0.04]}>
            <boxGeometry args={[0.03, 0.05, 0.05]} />
          </mesh>
        ))}
        {/* 수화기: rest(고정 자리) > ring(벨 진동·hover) > lift(픽업) */}
        <group position={[HANDSET_REST.x, HANDSET_REST.y, HANDSET_REST.z]}>
          <group ref={ringG}>
            <group ref={liftG}>
              <group {...handlers}>
                <mesh material={bakelite} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <capsuleGeometry args={[0.022, 0.26, 6, 16]} />
                </mesh>
                {[-0.16, 0.16].map((hx) => (
                  <mesh key={hx} material={bakelite} position={[hx, -0.012, 0]} castShadow>
                    <cylinderGeometry args={[0.052, 0.045, 0.05, 32]} />
                  </mesh>
                ))}
                {/* 클릭·탭 영역을 넉넉하게(보이지 않음) */}
                <mesh>
                  <boxGeometry args={[0.46, 0.14, 0.2]} />
                  <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
        <mesh ref={cordMesh} material={bakelite} geometry={initialCord} />
      </group>

      <group ref={cardGroup} position={[0.33, 0, 0.1]} rotation={[0, -0.25, 0]}>
        <BusinessCardObject id="card:contact" context="contact" canInteract={() => rig.contactCard > 0.9} />
      </group>

      <group ref={ringAnchor} position={[0.24, 0.28, -0.12]} />
      <group ref={pickupAnchor} position={[-0.05, 0.01, 0.32]} />
    </group>
  )
}
