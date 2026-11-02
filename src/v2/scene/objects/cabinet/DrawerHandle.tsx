import { useEffect, useMemo } from 'react'
import { ExtrudeGeometry, Path, Shape } from 'three'
import { chrome, labelTexture } from './materials'

// 참고 디자인 단위(m). 원점은 서랍 앞판 가운데 조금 위
const BAR = { length: 0.34, r: 0.011, y: -0.035, standoff: 0.03 }
const LABEL = { w: 0.17, h: 0.064, y: 0.06, t: 0.008 }
const KEY = { r: 0.019, y: 0.06 }

/** 열쇠 구멍: 크롬 원판 + 어두운 구멍(동그라미 + 아래로 긴 홈) */
function Keyhole({ position }: { position: [number, number, number] }) {
  const slot = useMemo(() => {
    const s = new Shape()
    s.absarc(0, 0.004, 0.0055, 0, Math.PI * 2, false)
    const g = new ExtrudeGeometry(s, { depth: 0.002, bevelEnabled: false })
    return g
  }, [])
  useEffect(() => () => slot.dispose(), [slot])
  return (
    <group position={position}>
      <mesh material={chrome} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[KEY.r, KEY.r, 0.006, 28]} />
      </mesh>
      <mesh geometry={slot} position={[0, 0, 0.002]}>
        <meshStandardMaterial color="#18191b" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.007, 0.0035]}>
        <boxGeometry args={[0.004, 0.012, 0.002]} />
        <meshStandardMaterial color="#18191b" roughness={0.6} />
      </mesh>
    </group>
  )
}

/** 작은 라벨 홀더(크롬 테두리 + 라벨 카드) */
function LabelHolder({ label }: { label: string }) {
  const frame = useMemo(() => {
    const { w, h, t } = LABEL
    const s = new Shape()
    s.moveTo(-w / 2, -h / 2)
    s.lineTo(w / 2, -h / 2)
    s.lineTo(w / 2, h / 2)
    s.lineTo(-w / 2, h / 2)
    s.closePath()
    const hole = new Path()
    hole.moveTo(-w / 2 + t, -h / 2 + t)
    hole.lineTo(w / 2 - t, -h / 2 + t)
    hole.lineTo(w / 2 - t, h / 2 - t)
    hole.lineTo(-w / 2 + t, h / 2 - t)
    hole.closePath()
    s.holes.push(hole)
    return new ExtrudeGeometry(s, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.001, bevelSegments: 2 })
  }, [])
  const tex = useMemo(() => labelTexture(label), [label])
  useEffect(
    () => () => {
      frame.dispose()
      tex.dispose()
    },
    [frame, tex],
  )
  return (
    <group position={[0, LABEL.y, 0]}>
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[LABEL.w - LABEL.t * 2, LABEL.h - LABEL.t * 2]} />
        <meshStandardMaterial map={tex} roughness={0.8} />
      </mesh>
      <mesh geometry={frame} material={chrome} />
    </group>
  )
}

/**
 * 서랍 앞판 손잡이: 가로형 크롬 바 + (라벨이 있으면) 작은 라벨 홀더 + 열쇠 구멍.
 * 라벨이 있으면 열쇠 구멍은 라벨 오른쪽, 없으면 바 위 가운데.
 */
export default function DrawerHandle({ label }: { label: string }) {
  const { length, r, y, standoff } = BAR
  return (
    <group>
      {/* 가로 바 */}
      <mesh material={chrome} position={[0, y, standoff]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[r, r, length, 20]} />
      </mesh>
      {/* 바를 받치는 다리 두 개 */}
      {[-length / 2 + 0.03, length / 2 - 0.03].map((x) => (
        <mesh key={x} material={chrome} position={[x, y, standoff / 2]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[r * 0.8, r * 0.9, standoff, 14]} />
        </mesh>
      ))}
      {label && <LabelHolder label={label} />}
      <Keyhole position={[label ? LABEL.w / 2 + 0.05 : 0, KEY.y, 0.003]} />
    </group>
  )
}
