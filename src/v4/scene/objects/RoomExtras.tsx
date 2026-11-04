import { useEffect, useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { v4Materials } from '../models/materials'
import { BookModel } from '../models/DeskProps'

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** 회색·베이지 직조 무늬(굵은 실이 엇갈린 결) */
function rugTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  const r = rng(9)
  ctx.fillStyle = '#9b958c'
  ctx.fillRect(0, 0, 256, 256)
  for (let y = 0; y < 256; y += 4) {
    for (let x = 0; x < 256; x += 4) {
      const odd = ((x >> 2) + (y >> 2)) % 2
      const v = (odd ? 150 : 128) + (r() - 0.5) * 40
      ctx.fillStyle = `rgb(${v + 12},${v + 6},${v - 4})`
      ctx.fillRect(x, y, 4, 3)
    }
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(10, 4)
  t.anisotropy = 8
  return t
}

/** 바닥 러그: 두께 있는 직조 깔개. 원점은 바닥 가운데 */
export function Rug({ size = [2.3, 1.2] as [number, number], ...props }: ThreeElements['group'] & { size?: [number, number] }) {
  const map = useMemo(() => rugTexture(), [])
  useEffect(() => () => map.dispose(), [map])
  return (
    <group {...props}>
      <RoundedBox args={[size[0], 0.008, size[1]]} radius={0.003} smoothness={2} position={[0, 0.004, 0]} receiveShadow>
        <meshStandardMaterial map={map} bumpMap={map} bumpScale={1.2} roughness={1} />
      </RoundedBox>
    </group>
  )
}

/**
 * 왼쪽 앞 철제 선반(화면 왼쪽 아래에 걸쳐 보이는 전경). 쌓인 책 몇 권.
 * 카메라에 가장 가까워 포인터 시차가 크게 나 공간의 깊이를 만든다. 원점은 바닥, 앞면이 +x(방 안쪽).
 */
export function ForegroundShelf(props: ThreeElements['group']) {
  const m = v4Materials()
  const levels = [0.12, 0.5, 0.88]
  const W = 0.5
  const D = 0.32
  return (
    <group {...props}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(sx * (D - 0.03)) / 2, 0.47, (sz * (W - 0.03)) / 2]} material={m.steelDark} castShadow>
            <boxGeometry args={[0.03, 0.94, 0.03]} />
          </mesh>
        )),
      )}
      {levels.map((y, i) => (
        <group key={y} position={[0, y, 0]}>
          <mesh material={m.brushedSteel} castShadow receiveShadow>
            <boxGeometry args={[D, 0.016, W]} />
          </mesh>
          {/* 쌓인 책 */}
          {Array.from({ length: 3 + (i % 2) }, (_, k) => (
            <BookModel
              key={k}
              position={[0.02, 0.008 + k * 0.03, (k % 2) * 0.02 - 0.01]}
              rotation-y={Math.PI / 2 + (k % 2 ? 0.08 : -0.05)}
              size={[0.22, 0.028, 0.28]}
              cover={['#d9d4ca', '#4a5560', '#b9b2a4', '#2f3338'][(k + i) % 4]}
            />
          ))}
        </group>
      ))}
    </group>
  )
}
