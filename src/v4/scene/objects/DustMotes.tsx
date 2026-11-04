import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, PointsMaterial, Vector3 } from 'three'
import { ROOM } from '../../../v2/config/layout'
import { ACTIVE_LIGHTING, LIGHTING } from '../../../v2/config/lighting'
import { DUST } from '../../config/home'
import { prefersReducedMotion } from '../pointer'

/** 같은 결과가 나오는 간단한 난수 */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** 가장자리가 부드러운 동그란 점 */
function dotTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 32
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.5)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 32, 32)
  return new CanvasTexture(c)
}

/**
 * 창으로 들어오는 햇살 속 먼지. 창 구멍에서 햇빛 방향으로 뻗은 빛기둥 안에만 놓고 아주 느리게 떠다닌다.
 * 빛기둥을 벗어나면 반대쪽으로 다시 들어온다. 움직임 줄이기면 멈춘다.
 */
export default function DustMotes() {
  const sun = LIGHTING[ACTIVE_LIGHTING].sun
  const dir = useMemo(() => new Vector3(...sun.target).sub(new Vector3(...sun.position)).normalize(), [sun])
  const { geometry, material, seeds } = useMemo(() => {
    const [wz, wy] = ROOM.window.center
    const [ww, wh] = ROOM.window.size
    const r = rng(3)
    const seeds = Array.from({ length: DUST.count }, () => {
      // 창 구멍의 한 점 + 빛 방향으로 들어간 거리
      const z = wz - ww / 2 + 0.08 + r() * (ww - 0.16)
      const y = wy - wh / 2 + 0.08 + r() * (wh - 0.16)
      // 뒷벽에 닿기 전까지만
      const maxT = Math.min(DUST.depth, (z - ROOM.wallZ) / Math.max(0.01, -dir.z) - 0.05)
      return { z, y, t: r() * maxT, maxT, phase: r() * 100, speed: 0.6 + r() * 0.8 }
    })
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(DUST.count * 3), 3))
    const material = new PointsMaterial({
      map: dotTexture(),
      color: '#fff1d6',
      size: DUST.size,
      sizeAttenuation: true,
      transparent: true,
      opacity: DUST.opacity,
      depthWrite: false,
      blending: AdditiveBlending,
    })
    return { geometry, material, seeds }
  }, [dir])
  useEffect(
    () => () => {
      geometry.dispose()
      material.map?.dispose()
      material.dispose()
    },
    [geometry, material],
  )
  const reduced = useMemo(() => prefersReducedMotion(), [])

  useFrame(({ clock }, dt) => {
    const arr = geometry.attributes.position.array as Float32Array
    const time = clock.elapsedTime
    seeds.forEach((s, i) => {
      if (!reduced) {
        // 빛 방향으로 아주 천천히 흐르고, 끝에 닿으면 창 쪽에서 다시 시작
        s.t += DUST.drift * s.speed * Math.min(dt, 0.1)
        if (s.t > s.maxT) s.t = 0
      }
      const wob = reduced ? 0 : 0.03
      const x = ROOM.sideX + 0.02 + dir.x * s.t + Math.sin(time * 0.31 * s.speed + s.phase) * wob
      const y = s.y + dir.y * s.t + Math.sin(time * 0.23 * s.speed + s.phase * 1.3) * wob
      const z = s.z + dir.z * s.t + Math.cos(time * 0.27 * s.speed + s.phase * 0.7) * wob
      arr[i * 3] = x
      arr[i * 3 + 1] = y
      arr[i * 3 + 2] = z
    })
    geometry.attributes.position.needsUpdate = true
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
