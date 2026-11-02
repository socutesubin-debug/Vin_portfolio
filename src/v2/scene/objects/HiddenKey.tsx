import { useMemo, useRef, useState, type MutableRefObject } from 'react'
import { useFrame, type ThreeElements, type ThreeEvent } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { MeshStandardMaterial, type Group } from 'three'
import { overlayOpen, useWorkspace } from '../../state/workspaceStore'

/** 열쇠를 주운 뒤 떠오르며 사라지는 시간(초) */
const PICKUP = 0.7
/** 아무것도 안 할 때 가끔 반짝이는 간격(초) — 찾을 수 있게 아주 살짝만 */
const IDLE_GLINT = 6
/** 클릭했지만 아직 시작 시각을 못 정한 상태 */
const PENDING = -2

const setCursor = (on: boolean) => {
  document.body.style.cursor = on ? 'pointer' : ''
}

/**
 * 이스터에그: 머그컵 밑에 끼워 둔 작은 황동 열쇠.
 * 마우스를 올리면 반짝이고, 클릭하면 떠오르며 사라지고 열쇠를 얻는다(이후 잠긴 서랍이 열린다).
 * 원점은 책상 위 고리 중앙, 열쇠 몸통은 로컬 +x로 뻗는다.
 */
export default function HiddenKey(props: ThreeElements['group']) {
  const hasKey = useWorkspace((s) => s.hasKey)
  // 이미 주운 상태로 방문하면 처음부터 없다
  const [gone, setGone] = useState(hasKey)
  const [hovered, setHovered] = useState(false)
  const body = useRef<Group>(null)
  const pickedAt = useRef(-1)
  const brass = useMemo(
    () => new MeshStandardMaterial({ color: '#c9a24a', metalness: 1, roughness: 0.28, emissive: '#ffd27a', emissiveIntensity: 0 }),
    [],
  )

  useFrame(({ clock }) => {
    const g = body.current
    if (!g) return
    const t = clock.elapsedTime
    if (pickedAt.current >= 0) {
      const k = Math.min(1, (t - pickedAt.current) / PICKUP)
      g.position.y = 0.09 * Math.sin((k * Math.PI) / 2)
      g.rotation.y = k * Math.PI * 2
      g.scale.setScalar(1 - k * k)
      brass.emissiveIntensity = 0.8 * (1 - k)
      if (k >= 1) setGone(true)
      return
    }
    // 올리면 반짝, 평소엔 가끔 아주 살짝
    const idle = Math.max(0, Math.sin(((t % IDLE_GLINT) / IDLE_GLINT) * Math.PI * 2 - 1.2)) ** 12
    brass.emissiveIntensity = hovered ? 0.35 + 0.25 * Math.sin(t * 8) : idle * 0.4
  })

  if (gone) return null

  const active = () => {
    const s = useWorkspace.getState()
    return !s.hasKey && !overlayOpen(s) && pickedAt.current < 0
  }
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!active()) return
    e.stopPropagation()
    setHovered(true)
    setCursor(true)
  }
  const onOut = () => {
    setHovered(false)
    setCursor(false)
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!active()) return
    e.stopPropagation()
    setHovered(false)
    setCursor(false)
    // 떠오르는 애니메이션 시작 시각은 다음 프레임에 R3F clock 기준으로 맞춘다(PickupClock)
    pickedAt.current = PENDING
    useWorkspace.getState().takeKey()
  }

  return (
    <group {...props}>
      <group ref={body}>
        <KeyShape material={brass} />
        {/* 클릭하기 쉽게 넓힌 투명 판정 영역 */}
        <mesh position={[0.02, 0.01, 0]} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
          <sphereGeometry args={[0.04, 12, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {hovered && <Sparkles count={14} scale={[0.09, 0.05, 0.07]} position={[0.01, 0.02, 0]} size={1.6} speed={0.5} color="#fff3c4" />}
      </group>
      <PickupClock pickedAt={pickedAt} />
    </group>
  )
}

/** 클릭 순간의 clock 시각을 기록한다(이벤트 안에서는 R3F clock을 바로 못 읽어서 한 프레임 늦게 맞춘다) */
function PickupClock({ pickedAt }: { pickedAt: MutableRefObject<number> }) {
  useFrame(({ clock }) => {
    if (pickedAt.current === PENDING) pickedAt.current = clock.elapsedTime
  })
  return null
}

/** 황동 열쇠: 고리 + 몸통 + 이 */
function KeyShape({ material }: { material: MeshStandardMaterial }) {
  return (
    <group position={[0, 0.0025, 0]}>
      <mesh material={material} rotation-x={Math.PI / 2} castShadow>
        <torusGeometry args={[0.011, 0.0028, 10, 28]} />
      </mesh>
      <mesh material={material} position={[0.035, 0, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.0022, 0.0022, 0.048, 10]} />
      </mesh>
      {[0.046, 0.054].map((x, i) => (
        <mesh key={x} material={material} position={[x, 0, 0.0045]}>
          <boxGeometry args={[0.005, 0.003, i ? 0.006 : 0.009]} />
        </mesh>
      ))}
    </group>
  )
}
