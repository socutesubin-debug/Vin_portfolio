import { useEffect, useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { FINISH } from '../../config/layout'

const PAGE = { w: 0.15, d: 0.21 }

/** 줄 노트 한 쪽(손글씨 흔적 몇 줄) */
function pageTexture(seed: number) {
  const c = document.createElement('canvas')
  c.width = 300
  c.height = 420
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#f7f3ea'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.strokeStyle = 'rgba(120, 140, 170, 0.35)'
  ctx.lineWidth = 1
  for (let y = 46; y < c.height - 20; y += 18) {
    ctx.beginPath()
    ctx.moveTo(18, y)
    ctx.lineTo(c.width - 18, y)
    ctx.stroke()
  }
  // 스케치·메모 흔적(글자가 아닌 가는 선)
  ctx.strokeStyle = 'rgba(40, 40, 50, 0.55)'
  ctx.lineWidth = 1.4
  let s = seed
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  for (let i = 0; i < 7; i++) {
    const y = 60 + i * 36 + r() * 6
    const len = 80 + r() * 150
    ctx.beginPath()
    ctx.moveTo(26, y)
    for (let x = 26; x < 26 + len; x += 8) ctx.lineTo(x, y + Math.sin(x * 0.35 + i) * 2.2)
    ctx.stroke()
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** 펼친 노트 + 펜("작업 흔적"). 원점은 책상 위 노트 중앙 */
export default function Notebook(props: ThreeElements['group']) {
  const [left, right] = useMemo(() => [pageTexture(3), pageTexture(11)], [])
  useEffect(
    () => () => {
      left.dispose()
      right.dispose()
    },
    [left, right],
  )

  return (
    <group {...props}>
      {/* 표지(살짝 보이는 가장자리) */}
      <mesh position={[0, 0.002, 0]} receiveShadow>
        <boxGeometry args={[PAGE.w * 2 + 0.012, 0.004, PAGE.d + 0.01]} />
        <meshStandardMaterial color="#5b5148" roughness={0.8} />
      </mesh>
      {/* 양쪽 페이지: 가운데로 살짝 기울어 V자 */}
      {[
        [-1, left],
        [1, right],
      ].map(([side, map]) => (
        <mesh
          key={side as number}
          position={[(side as number) * (PAGE.w / 2 + 0.002), 0.008, 0]}
          rotation-z={(side as number) * 0.05}
          receiveShadow
        >
          <boxGeometry args={[PAGE.w, 0.006, PAGE.d]} />
          <meshStandardMaterial attach="material-2" map={map as CanvasTexture} roughness={0.85} />
          <meshStandardMaterial attach="material-0" color="#efe9dc" roughness={0.9} />
          <meshStandardMaterial attach="material-1" color="#efe9dc" roughness={0.9} />
          <meshStandardMaterial attach="material-3" color="#efe9dc" roughness={0.9} />
          <meshStandardMaterial attach="material-4" color="#efe9dc" roughness={0.9} />
          <meshStandardMaterial attach="material-5" color="#efe9dc" roughness={0.9} />
        </mesh>
      ))}
      {/* 펜: 오른쪽 페이지 위에 비스듬히 */}
      <group position={[0.06, 0.016, 0.02]} rotation-y={0.7}>
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.0045, 0.0045, 0.14, 16]} />
          <meshStandardMaterial color={FINISH.black} roughness={0.35} />
        </mesh>
        <mesh position={[0.075, 0, 0]} rotation-z={-Math.PI / 2}>
          <coneGeometry args={[0.0045, 0.012, 16]} />
          <meshStandardMaterial color={FINISH.silver} metalness={1} roughness={0.2} />
        </mesh>
        <mesh position={[-0.045, 0.005, 0]}>
          <boxGeometry args={[0.04, 0.0015, 0.0025]} />
          <meshStandardMaterial color={FINISH.silver} metalness={1} roughness={0.2} />
        </mesh>
      </group>
    </group>
  )
}
