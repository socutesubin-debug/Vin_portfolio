import { useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeElements, type ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Euler, MeshStandardMaterial, Quaternion, Vector3, type Group, type PerspectiveCamera } from 'three'
import { HANDSET_POSE, isRinging } from '../../config/contact'
import { nowSec, overlayOpen, useWorkspace } from '../../state/workspaceStore'
import CoilCord from './phone/CoilCord'

const BODY = '#efe6d6'
const HANDSET = '#1d1e22'

/** 수화기가 거치대에 놓인 자리(전화기 기준) */
const REST_POS = new Vector3(0, 0.1, -0.035)
/** 코드가 이어지는 곳: 본체 왼쪽 옆 / 수화기 송화부(왼쪽 컵) 아래 */
const CORD_BODY = new Vector3(-0.1, 0.03, -0.02)
const CORD_HANDSET = new Vector3(-0.095, -0.028, 0)

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const setCursor = (on: boolean) => {
  document.body.style.cursor = on ? 'pointer' : ''
}

// 매 프레임 쓰는 임시 값
const vA = new Vector3()
const vB = new Vector3()
const qA = new Quaternion()
const qB = new Quaternion()
const qParent = new Quaternion()
const eTilt = new Euler()

/**
 * 다이얼 전화기. CONTACT에 오면 따르릉 흔들리며 표시등이 깜빡이고,
 * 마우스를 올리면 수화기가 살짝 들리며, 클릭하면 수화기가 화면 오른쪽(세로 화면은 위쪽)으로 들려 온다.
 * 원점은 책상 위 본체 중앙.
 */
export default function Telephone(props: ThreeElements['group']) {
  const shaker = useRef<Group>(null)
  const handset = useRef<Group>(null)
  const lift = useRef(0)
  const hoverLift = useRef(0)
  const hovered = useRef(false)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const lamp = useMemo(() => new MeshStandardMaterial({ color: '#7a2a1c', emissive: '#ff5a36', emissiveIntensity: 0 }), [])

  useFrame((_, dt) => {
    const s = useWorkspace.getState()
    const rm = reduced()
    const t = s.ringAt === null ? -1 : nowSec() - s.ringAt
    const ringing = !s.ringSilenced && !s.callOpen && isRinging(t)

    // 따르릉: 본체째 잘게 흔들림(움직임 줄이기면 생략)
    const g = shaker.current
    if (g) {
      const k = ringing && !rm ? 1 : 0
      g.rotation.z = k * 0.03 * Math.sin(t * 72)
      g.rotation.x = k * 0.012 * Math.sin(t * 53)
      g.position.y = k * 0.0025 * Math.abs(Math.sin(t * 61))
    }

    // 표시등: 울릴 때는 빠르게, 못 받은 동안은 천천히 깜빡인다
    const waiting = s.activeScene === 'contact' && !s.callOpen
    lamp.emissiveIntensity = ringing ? (Math.sin(t * 18) > 0 ? 2.4 : 0.2) : waiting ? 0.6 + 0.6 * Math.sin(nowSec() * 3) : 0

    // 수화기: 들기(통화) / hover 살짝 들림
    const goal = s.callOpen ? 1 : 0
    lift.current += (goal - lift.current) * (1 - Math.exp(-dt * (rm ? 30 : 4.2)))
    hoverLift.current += ((hovered.current && !s.callOpen ? 1 : 0) - hoverLift.current) * (1 - Math.exp(-dt * 10))
    const h = handset.current
    const parent = h?.parent
    if (!h || !parent) return

    const w = lift.current
    const bounce = ringing && !rm ? 0.004 * Math.abs(Math.sin(t * 60)) : 0
    // 놓인 자리(전화기 기준)
    h.position.copy(REST_POS)
    h.position.y += hoverLift.current * 0.018 + bounce
    h.rotation.set(0, 0, hoverLift.current * 0.14)
    if (w < 0.001) return

    // 카메라 앞 목표 자리(월드) → 전화기 기준으로 바꿔 섞는다
    const aspect = size.width / size.height
    const pose = aspect < HANDSET_POSE.narrowBelow ? HANDSET_POSE.narrow : HANDSET_POSE.wide
    const halfH = Math.tan((camera.fov * Math.PI) / 360) * pose.distance
    vA.set(pose.x * halfH * aspect, pose.y * halfH, -pose.distance).applyMatrix4(camera.matrixWorld)
    eTilt.set(...pose.tilt)
    qA.copy(camera.quaternion).multiply(qB.setFromEuler(eTilt))
    parent.updateWorldMatrix(true, false)
    parent.worldToLocal(vA)
    parent.getWorldQuaternion(qParent)
    qA.premultiply(qParent.invert())

    const e = w * w * (3 - 2 * w)
    vB.copy(h.position)
    h.position.lerpVectors(vB, vA, e)
    // 들려 올라가는 호(움직임 줄이기면 곧게)
    if (!rm) h.position.y += Math.sin(e * Math.PI) * 0.12
    qB.setFromEuler(h.rotation)
    h.quaternion.slerpQuaternions(qB, qA, e)
  })

  const getCordEnd = (out: Vector3) => {
    const h = handset.current
    if (!h) return out.copy(REST_POS).add(CORD_HANDSET)
    return out.copy(CORD_HANDSET).applyQuaternion(h.quaternion).add(h.position)
  }

  // CONTACT 장면이고 2D 화면이 떠 있지 않을 때만 반응한다
  const active = () => {
    const s = useWorkspace.getState()
    return s.activeScene === 'contact' && !overlayOpen(s)
  }
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!active()) return
    e.stopPropagation()
    if (e.pointerType === 'mouse') hovered.current = true
    setCursor(true)
    useWorkspace.getState().setPhoneHover({ x: e.nativeEvent.clientX, y: e.nativeEvent.clientY })
  }
  const onOut = () => {
    hovered.current = false
    setCursor(false)
    useWorkspace.getState().setPhoneHover(null)
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!active()) return
    e.stopPropagation()
    hovered.current = false
    setCursor(false)
    useWorkspace.getState().answerCall()
  }

  return (
    <group {...props}>
      <group ref={shaker}>
        {/* 본체 */}
        <RoundedBox args={[0.2, 0.08, 0.22]} radius={0.025} position={[0, 0.04, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={BODY} roughness={0.45} />
        </RoundedBox>
        {/* 다이얼: 앞쪽 경사면 */}
        <group position={[0, 0.084, 0.055]} rotation-x={0.3}>
          <mesh>
            <cylinderGeometry args={[0.055, 0.055, 0.012, 32]} />
            <meshStandardMaterial color="#d8cdb9" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.007, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.004, 24]} />
            <meshStandardMaterial color={HANDSET} />
          </mesh>
        </group>
        {/* 표시등(앞면 오른쪽) */}
        <mesh position={[0.072, 0.05, 0.111]} material={lamp}>
          <sphereGeometry args={[0.006, 16, 10]} />
        </mesh>

        {/* 수화기: 손잡이 + 양 끝 송수화부 */}
        <group ref={handset} position={REST_POS.toArray()}>
          <mesh rotation-z={Math.PI / 2} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.2, 16]} />
            <meshStandardMaterial color={HANDSET} roughness={0.35} />
          </mesh>
          {[-0.095, 0.095].map((x) => (
            <mesh key={x} position={[x, -0.012, 0]} castShadow>
              <cylinderGeometry args={[0.032, 0.026, 0.035, 24]} />
              <meshStandardMaterial color={HANDSET} roughness={0.35} />
            </mesh>
          ))}
        </group>

        <CoilCord start={CORD_BODY} getEnd={getCordEnd} />
      </group>

      {/* 마우스·탭 판정 영역(전화기 전체) */}
      <mesh position={[0, 0.07, 0]} onPointerMove={onMove} onPointerOut={onOut} onClick={onClick}>
        <boxGeometry args={[0.26, 0.16, 0.26]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
