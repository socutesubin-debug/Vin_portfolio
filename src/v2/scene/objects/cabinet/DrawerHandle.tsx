import { useEffect, useMemo } from 'react'
import { ExtrudeGeometry, Path, Shape } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { chrome, chromeDouble, cupInner, labelTexture } from './materials'

// 참고 디자인 치수(m)
const FW = 0.2
const FH = 0.085
const T = 0.011
const FY = 0.045
const HW = FW / 2
const HH = FH / 2
const IW = HW - T * 1.6
const IH = HH - T
const CY = -0.035
const CUP = { w: 0.085, h: 0.05, d: 0.045 }

const screwHalf = (r: number) => [r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2] as const

/** 라벨 홀더 프레임(라벨 카드 포함) + 컵 손잡이 */
export default function DrawerHandle({ label }: { label: string }) {
  const frameGeo = useMemo(() => {
    const r = 0.008
    const s = new Shape()
    s.moveTo(-HW + r, -HH)
    s.lineTo(HW - r, -HH)
    s.quadraticCurveTo(HW, -HH, HW, -HH + r)
    s.lineTo(HW, HH - r)
    s.quadraticCurveTo(HW, HH, HW - r, HH)
    s.lineTo(-HW + r, HH)
    s.quadraticCurveTo(-HW, HH, -HW, HH - r)
    s.lineTo(-HW, -HH + r)
    s.quadraticCurveTo(-HW, -HH, -HW + r, -HH)
    const hole = new Path()
    hole.moveTo(-IW, -IH)
    hole.lineTo(IW, -IH)
    hole.lineTo(IW, IH)
    hole.lineTo(-IW, IH)
    hole.closePath()
    s.holes.push(hole)
    return new ExtrudeGeometry(s, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.0015, bevelSegments: 3 })
  }, [])
  const plateGeo = useMemo(() => new RoundedBoxGeometry(0.19, 0.06, 0.005, 3, 0.0025), [])
  const tex = useMemo(() => labelTexture(label), [label])

  useEffect(
    () => () => {
      frameGeo.dispose()
      plateGeo.dispose()
      tex.dispose()
    },
    [frameGeo, plateGeo, tex],
  )

  return (
    <group>
      {/* 라벨 카드 */}
      <mesh position={[0, FY, 0.001]}>
        <planeGeometry args={[IW * 2, IH * 2]} />
        <meshStandardMaterial map={tex} roughness={0.8} />
      </mesh>
      <mesh geometry={frameGeo} material={chrome} position={[0, FY, 0.002]} castShadow />
      {/* 안쪽 접힌 립(위/아래) */}
      {[IH - 0.001, -IH + 0.001].map((y) => (
        <mesh key={y} material={chrome} position={[0, FY + y, 0.007]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.0035, 0.0035, IW * 2, 12]} />
        </mesh>
      ))}
      {/* 모서리 나사 */}
      {[-HW + 0.009, HW - 0.009].flatMap((x) =>
        [HH - 0.009, -HH + 0.009].map((y) => (
          <mesh key={`${x}${y}`} material={chrome} position={[x, FY + y, 0.0075]} rotation-x={Math.PI / 2} scale-y={0.5}>
            <sphereGeometry args={screwHalf(0.0055)} />
          </mesh>
        )),
      )}

      {/* 컵 손잡이 */}
      <mesh geometry={plateGeo} material={chrome} position={[0, CY + 0.006, 0.0025]} castShadow />
      {[-0.083, 0.083].map((x) => (
        <mesh key={x} material={chrome} position={[x, CY + 0.006, 0.005]} rotation-x={Math.PI / 2} scale-y={0.5}>
          <sphereGeometry args={screwHalf(0.005)} />
        </mesh>
      ))}
      {/* 앞·위로 볼록하고 아래가 열린 후드 */}
      <mesh material={chromeDouble} position={[0, CY - 0.008, 0.005]} scale={[CUP.w, CUP.h, CUP.d]} castShadow>
        <sphereGeometry args={[1, 48, 24, 0, Math.PI, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={chrome} position={[0, CY - 0.008, 0.005]} rotation-x={Math.PI / 2} scale={[CUP.w, CUP.d, CUP.w * 0.9]}>
        <torusGeometry args={[1, 0.075, 12, 48, Math.PI]} />
      </mesh>
      <mesh material={cupInner} position={[0, CY - 0.008, 0.005]} scale={[CUP.w, CUP.h, CUP.d]}>
        <sphereGeometry args={[0.97, 32, 16, 0, Math.PI, 0, Math.PI / 2]} />
      </mesh>
    </group>
  )
}
