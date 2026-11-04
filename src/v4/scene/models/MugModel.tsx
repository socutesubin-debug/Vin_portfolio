import { useEffect, useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { CatmullRomCurve3, CylinderGeometry, LatheGeometry, TubeGeometry, Vector2, Vector3 } from 'three'
import { makeCanvasTexture, SANS } from '../../../utils/canvasTexture'
import { v4Materials } from './materials'

const R = 0.04
const H = 0.098

/** 바깥 굽 → 몸통 → 둥근 입술 → 안쪽 벽 → 안 바닥까지 한 번에 도는 단면(두께 있는 도자기) */
function bodyGeometry() {
  const pts: [number, number][] = [
    [0, 0.003],
    [R - 0.006, 0.0],
    [R - 0.002, 0.002],
    [R - 0.0005, 0.008],
    [R, 0.03],
    [R + 0.0005, H - 0.006],
    [R + 0.0002, H - 0.0015],
    [R - 0.0015, H],
    [R - 0.0035, H - 0.0012],
    [R - 0.0042, H - 0.006],
    [R - 0.0046, 0.02],
    [R - 0.008, 0.0095],
    [0, 0.008],
  ]
  return new LatheGeometry(
    pts.map(([x, y]) => new Vector2(x, y)),
    72,
  )
}

/** 손잡이: C자 곡선을 따라 둥근 단면 */
function handleGeometry() {
  const c = new CatmullRomCurve3(
    [
      [R - 0.002, 0.078],
      [R + 0.018, 0.08],
      [R + 0.03, 0.062],
      [R + 0.029, 0.036],
      [R + 0.015, 0.022],
      [R - 0.002, 0.024],
    ].map(([x, y]) => new Vector3(x, y, 0)),
  )
  return new TubeGeometry(c, 40, 0.0062, 14)
}

/** 앞면 VIN 글씨(유약 아래 인쇄) */
const decalTexture = () =>
  makeCanvasTexture(256, 96, (ctx, W, Hh) => {
    ctx.clearRect(0, 0, W, Hh)
    ctx.fillStyle = '#26282c'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `600 54px ${SANS}`
    ctx.fillText('VIN', W / 2, Hh / 2 + 2)
  })

/**
 * 머그: 두께 있는 회전체(굽·입술·안쪽 벽) + 손잡이 + 남은 커피 + VIN 인쇄. 유약 바른 도자기 재질.
 * 원점은 책상 위 바닥 가운데, 글씨가 +z(앞), 손잡이가 +x. [절차 모델]
 */
export default function MugModel(props: ThreeElements['group']) {
  const m = v4Materials()
  const body = useMemo(() => bodyGeometry(), [])
  const handle = useMemo(() => handleGeometry(), [])
  const decal = useMemo(() => decalTexture(), [])
  // 글씨 띠: 몸통 바로 바깥, 앞쪽 일부만
  const band = useMemo(() => new CylinderGeometry(R + 0.0009, R + 0.0009, 0.032, 48, 1, true, -0.55, 1.1), [])
  useEffect(
    () => () => {
      body.dispose()
      handle.dispose()
      band.dispose()
      decal.dispose()
    },
    [body, handle, band, decal],
  )
  return (
    <group {...props}>
      <mesh geometry={body} material={m.ceramic} castShadow receiveShadow />
      <mesh geometry={handle} material={m.ceramic} castShadow receiveShadow />
      <mesh position={[0, H - 0.026, 0]} rotation-x={-Math.PI / 2} material={m.coffee}>
        <circleGeometry args={[R - 0.0045, 48]} />
      </mesh>
      <mesh geometry={band} position={[0, 0.052, 0]}>
        <meshPhysicalMaterial map={decal} transparent roughness={0.45} clearcoat={1} clearcoatRoughness={0.05} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
    </group>
  )
}
