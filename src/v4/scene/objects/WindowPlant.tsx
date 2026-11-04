import { useMemo, useRef } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import type { Group } from 'three'
import { PLANT_SWAY } from '../../config/home'
import { prefersReducedMotion } from '../pointer'

/** 같은 결과가 나오는 간단한 난수 */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

interface LeafDef {
  yaw: number
  pitch: number
  len: number
  width: number
  color: string
  /** 흔들리는 잎이면 위상·빠르기 */
  sway: { phase: number; f1: number; f2: number } | null
}

const GREENS = ['#4f7a3e', '#5f8a4a', '#6f9a57', '#47713a']

function makeLeaves(): LeafDef[] {
  const r = rng(11)
  return Array.from({ length: 26 }, (_, i) => {
    // 바깥으로 늘어지는 덩굴 잎(포토스) 몇 장 + 위로 선 잎
    const trailing = i % 5 === 0
    return {
      yaw: r() * Math.PI * 2,
      pitch: trailing ? 1.25 + r() * 0.5 : 0.2 + r() * 0.75,
      len: trailing ? 0.15 + r() * 0.07 : 0.09 + r() * 0.07,
      width: 0.022 + r() * 0.012,
      color: GREENS[i % GREENS.length],
      sway: r() < PLANT_SWAY.share ? { phase: r() * 10, f1: 0.7 + r() * 0.6, f2: 1.7 + r() * 0.9 } : null,
    }
  })
}

/** 잎 하나: 줄기 끝의 납작한 타원. 흔들리는 잎은 밑동을 축으로 돈다 */
function Leaf({ def, register }: { def: LeafDef; register: (g: Group | null) => void }) {
  return (
    <group rotation={[0, def.yaw, def.pitch]}>
      <group ref={def.sway ? register : undefined}>
        <mesh position={[0, def.len / 2, 0]} scale={[def.width, def.len / 2, 0.006]} castShadow>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color={def.color} roughness={0.55} />
        </mesh>
      </group>
    </group>
  )
}

/**
 * 창턱 큰 화분(흰 도자기 + 포토스 잎). 잎 일부만 느리고 불규칙하게 흔들린다(사인파 두 개를 겹침).
 * [임시 모델] 잎은 타원체. 최종 에셋에서는 잎 메시로 교체.
 */
export default function WindowPlant(props: ThreeElements['group']) {
  const leaves = useMemo(() => makeLeaves(), [])
  const swaying = useRef(new Map<number, Group>())
  const reduced = useMemo(() => prefersReducedMotion(), [])

  useFrame(({ clock }) => {
    if (reduced) return
    const t = clock.elapsedTime * PLANT_SWAY.speed * Math.PI * 2
    swaying.current.forEach((g, i) => {
      const s = leaves[i].sway!
      const a = Math.sin(t * s.f1 + s.phase) * 0.6 + Math.sin(t * s.f2 + s.phase * 1.7) * 0.4
      g.rotation.z = a * PLANT_SWAY.amplitude
      g.rotation.x = Math.sin(t * s.f1 * 0.8 + s.phase * 2.3) * PLANT_SWAY.amplitude * 0.5
    })
  })

  return (
    <group {...props}>
      <mesh position={[0, 0.07, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.085, 0.065, 0.14, 32]} />
        <meshStandardMaterial color="#f2efe8" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.006, 0]} receiveShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.012, 32]} />
        <meshStandardMaterial color="#ebe6dc" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.136, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.08, 24]} />
        <meshStandardMaterial color="#5b4636" roughness={0.95} />
      </mesh>
      <group position={[0, 0.13, 0]}>
        {leaves.map((l, i) => (
          <Leaf
            key={i}
            def={l}
            register={(g) => {
              if (g) swaying.current.set(i, g)
              else swaying.current.delete(i)
            }}
          />
        ))}
      </group>
    </group>
  )
}
