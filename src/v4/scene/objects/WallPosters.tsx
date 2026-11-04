import { useEffect, useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { makeCanvasTexture, SANS } from '../../../utils/canvasTexture'

/** 큰 포스터: 미색 종이에 주황 아치 글자꼴 + 작은 캡션 */
const bigPoster = () =>
  makeCanvasTexture(400, 520, (ctx, W, H) => {
    ctx.fillStyle = '#f3efe6'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#e8613a'
    ctx.beginPath()
    ctx.moveTo(W * 0.2, H * 0.14)
    ctx.lineTo(W * 0.42, H * 0.14)
    ctx.lineTo(W * 0.42, H * 0.52)
    ctx.arc(W * 0.55, H * 0.52, W * 0.13, Math.PI, 0, true)
    ctx.lineTo(W * 0.68, H * 0.14)
    ctx.lineTo(W * 0.84, H * 0.14)
    ctx.lineTo(W * 0.84, H * 0.52)
    ctx.arc(W * 0.52, H * 0.52, W * 0.32, 0, Math.PI)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#2b2d31'
    ctx.font = `500 16px ${SANS}`
    ctx.textAlign = 'center'
    ctx.fillText('VISION INSIDE', W / 2, H * 0.9)
  })

/** 작은 카드: 파란 동그라미 / 파란 점 격자 / 엽서(건물) */
const card = (kind: 'dot' | 'grid' | 'photo') =>
  makeCanvasTexture(200, 200, (ctx, W, H) => {
    ctx.fillStyle = kind === 'grid' ? '#2f6fa8' : '#f3efe6'
    ctx.fillRect(0, 0, W, H)
    if (kind === 'dot') {
      ctx.fillStyle = '#2f6fa8'
      ctx.beginPath()
      ctx.arc(W / 2, H / 2, W * 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(W * 0.08, H * 0.08, W * 0.14, H * 0.14)
      ctx.fillRect(W * 0.78, H * 0.78, W * 0.14, H * 0.14)
    } else if (kind === 'grid') {
      ctx.fillStyle = '#e9eef4'
      for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) ctx.fillRect(W * 0.1 + x * W * 0.09, H * 0.1 + y * H * 0.09, 4, 4)
    } else {
      ctx.fillStyle = '#9cc4e4'
      ctx.fillRect(W * 0.08, H * 0.08, W * 0.84, H * 0.7)
      ctx.fillStyle = '#e9e3d6'
      ctx.fillRect(W * 0.2, H * 0.3, W * 0.6, H * 0.48)
      ctx.fillStyle = '#7c8ea3'
      for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) ctx.fillRect(W * 0.25 + x * W * 0.105, H * 0.36 + y * H * 0.1, W * 0.06, H * 0.06)
    }
  })

/**
 * 뒷벽 왼쪽 포스터 묶음(종이 텍스처). 원점은 큰 포스터 가운데, 앞면이 +z.
 * [임시 텍스처] 그림은 캔버스로 그린 자리표시. 최종 포스터 이미지로 교체.
 */
export default function WallPosters(props: ThreeElements['group']) {
  const maps = useMemo(() => ({ big: bigPoster(), dot: card('dot'), grid: card('grid'), photo: card('photo') }), [])
  useEffect(() => () => Object.values(maps).forEach((m) => m.dispose()), [maps])
  const items: { map: keyof typeof maps; pos: [number, number]; size: [number, number]; tilt: number }[] = [
    { map: 'big', pos: [0, 0], size: [0.34, 0.44], tilt: 0 },
    { map: 'photo', pos: [0.27, 0.12], size: [0.13, 0.17], tilt: 0.02 },
    { map: 'dot', pos: [0.3, -0.12], size: [0.12, 0.12], tilt: 0 },
    { map: 'grid', pos: [0.44, -0.12], size: [0.14, 0.12], tilt: 0 },
  ]
  return (
    <group {...props}>
      {items.map((it, i) => (
        <mesh key={i} position={[it.pos[0], it.pos[1], 0.001 + i * 0.0005]} rotation-z={it.tilt} receiveShadow>
          <planeGeometry args={it.size} />
          <meshStandardMaterial map={maps[it.map]} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}
