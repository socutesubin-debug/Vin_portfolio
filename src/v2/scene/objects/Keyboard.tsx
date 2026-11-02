import { useEffect, useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { FINISH } from '../../config/layout'

/** 키 배열(줄마다 키 폭 비율) */
const ROWS = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.2],
  [2.3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.7],
  [1.5, 1.2, 1.2, 6.4, 1.2, 1.2, 1.5],
]

/** 위에서 본 베이지 키 배열 */
function keysTexture() {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 320
  const ctx = c.getContext('2d')!
  ctx.fillStyle = FINISH.beigeDark
  ctx.fillRect(0, 0, c.width, c.height)
  const rowH = c.height / ROWS.length
  ROWS.forEach((row, r) => {
    const unit = c.width / row.reduce((a, b) => a + b, 0)
    let x = 0
    row.forEach((w) => {
      ctx.fillStyle = '#efe7d4'
      ctx.fillRect(x + 4, r * rowH + 5, w * unit - 8, rowH - 10)
      ctx.fillStyle = 'rgba(0,0,0,0.06)'
      ctx.fillRect(x + 4, r * rowH + rowH - 12, w * unit - 8, 7)
      x += w * unit
    })
  })
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** 레트로 베이지 키보드(살짝 앞으로 기울어진 두툼한 몸체, 작은 소품이라 그림자 없음). 원점은 책상 위 중앙 */
export default function Keyboard(props: ThreeElements['group']) {
  const map = useMemo(() => keysTexture(), [])
  useEffect(() => () => map.dispose(), [map])
  return (
    <group {...props}>
      <group rotation-x={0.05}>
        <RoundedBox args={[0.46, 0.03, 0.17]} radius={0.008} smoothness={3} position={[0, 0.017, 0]} receiveShadow>
          <meshStandardMaterial color={FINISH.beige} roughness={0.55} />
        </RoundedBox>
        <mesh position={[0, 0.0325, 0.006]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[0.43, 0.13]} />
          <meshStandardMaterial map={map} roughness={0.6} />
        </mesh>
      </group>
    </group>
  )
}
