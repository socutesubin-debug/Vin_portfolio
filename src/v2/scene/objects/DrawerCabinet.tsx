import { useEffect, useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { ExtrudeGeometry, Quaternion, Shape, Vector3 } from 'three'
import { CAB, CAB_H as H, CAB_N as N, CABINET_SCALE, DRAWER_SLOTS } from '../../config/cabinet'
import Drawer from './cabinet/Drawer'
import { chrome, paint, paintIn } from './cabinet/materials'

const { W, D, BASE, DH, R } = CAB
const UP = new Vector3(0, 1, 0)

/** a→b 크롬 파이프의 위치·회전·길이 */
function tube(a: Vector3, b: Vector3) {
  const v = new Vector3().subVectors(b, a)
  return {
    position: a.clone().add(b).multiplyScalar(0.5),
    quaternion: new Quaternion().setFromUnitVectors(UP, v.clone().normalize()),
    length: v.length(),
  }
}

/** 아치형 받침 옆모양. inner: 다리 안쪽, ctrl: 곡선 조절점, top: 아치 윗변 끝(모두 half 대비 비율) */
function archShape(half: number, inner: number, ctrl: number, top: number) {
  const ah = BASE * 0.55
  const s = new Shape()
  s.moveTo(-half, 0)
  s.lineTo(-half * inner, 0)
  s.quadraticCurveTo(-half * ctrl, ah, -half * top, ah)
  s.lineTo(half * top, ah)
  s.quadraticCurveTo(half * ctrl, ah, half * inner, 0)
  s.lineTo(half, 0)
  s.lineTo(half, BASE)
  s.lineTo(-half, BASE)
  s.closePath()
  return s
}

const BEVEL = { depth: 0.02, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 }

/**
 * 서랍장: 파란 도장 + 크롬 레일 + 아치형 받침 + 서랍 3칸.
 * 참고 디자인(VIN 서랍장) 원래 치수로 만들고 CABINET_SCALE배로 줄인다. 원점은 바닥 중앙, 서랍 앞면이 +z.
 */
export default function DrawerCabinet(props: ThreeElements['group']) {
  const { frontArch, sideArch } = useMemo(
    () => ({
      frontArch: new ExtrudeGeometry(archShape(W / 2, 0.78, 0.6, 0.45), BEVEL),
      sideArch: new ExtrudeGeometry(archShape(D / 2, 0.7, 0.5, 0.3), BEVEL),
    }),
    [],
  )
  useEffect(
    () => () => {
      frontArch.dispose()
      sideArch.dispose()
    },
    [frontArch, sideArch],
  )

  // 크롬 레일: 네 모서리 기둥 + 칸마다 앞뒤좌우 가로대, 이음새 구슬
  const { tubes, balls } = useMemo(() => {
    const x0 = -W / 2
    const x1 = W / 2
    const z0 = -D / 2
    const z1 = D / 2 + 0.005
    const V = (x: number, y: number, z: number) => new Vector3(x, y, z)
    const levels = Array.from({ length: N + 1 }, (_, i) => (i === N ? H : BASE + i * DH))
    const t: ReturnType<typeof tube>[] = []
    for (const x of [x0, x1]) for (const z of [z0, z1]) t.push(tube(V(x, BASE, z), V(x, H, z)))
    for (const y of levels) {
      t.push(tube(V(x0, y, z1), V(x1, y, z1)), tube(V(x0, y, z0), V(x1, y, z0)))
      t.push(tube(V(x0, y, z0), V(x0, y, z1)), tube(V(x1, y, z0), V(x1, y, z1)))
    }
    const b: [number, number, number][] = []
    for (const x of [x0, x1]) for (const z of [z0, z1]) for (const y of levels) b.push([x, y, z])
    return { tubes: t, balls: b }
  }, [])

  return (
    <group {...props}>
      <group scale={CABINET_SCALE}>
        {/* 몸체 */}
        <RoundedBox args={[W, 0.03, D]} radius={0.01} smoothness={3} position={[0, H - 0.015, 0]} material={paint} castShadow receiveShadow />
        <mesh material={paint} position={[-W / 2 + 0.01, BASE + (H - BASE) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.02, H - BASE, D]} />
        </mesh>
        <mesh material={paint} position={[W / 2 - 0.01, BASE + (H - BASE) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.02, H - BASE, D]} />
        </mesh>
        <mesh material={paint} position={[0, BASE + (H - BASE) / 2, -D / 2 + 0.01]} castShadow receiveShadow>
          <boxGeometry args={[W, H - BASE, 0.02]} />
        </mesh>
        {Array.from({ length: N }, (_, i) => (
          <mesh key={i} material={paintIn} position={[0, BASE + i * DH + 0.006, 0]} receiveShadow>
            <boxGeometry args={[W - 0.04, 0.012, D - 0.02]} />
          </mesh>
        ))}

        {/* 서랍 앞판 위쪽 틈 가림판: 닫힌 서랍 안이 틈으로 보이지 않게 한다 */}
        {Array.from({ length: N }, (_, i) => (
          <mesh key={i} material={paint} position={[0, BASE + (i + 1) * DH - 0.015, D / 2 - 0.032]}>
            <boxGeometry args={[W - 0.04, 0.03, 0.008]} />
          </mesh>
        ))}

        {/* 아치형 받침 */}
        <mesh geometry={frontArch} material={paint} position={[0, 0, D / 2 - 0.02]} castShadow receiveShadow />
        <mesh geometry={frontArch} material={paint} position={[0, 0, -D / 2]} castShadow receiveShadow />
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            geometry={sideArch}
            material={paint}
            rotation-y={Math.PI / 2}
            position={[s > 0 ? W / 2 : -W / 2 + 0.02, 0, 0]}
            castShadow
            receiveShadow
          />
        ))}

        {/* 크롬 레일 */}
        {tubes.map((t, i) => (
          <mesh key={i} material={chrome} position={t.position} quaternion={t.quaternion} castShadow>
            <cylinderGeometry args={[R, R, t.length, 20]} />
          </mesh>
        ))}
        {balls.map((p, i) => (
          <mesh key={i} material={chrome} position={p}>
            <sphereGeometry args={[R * 1.5, 16, 12]} />
          </mesh>
        ))}

        {DRAWER_SLOTS.map((slot, i) => (
          <Drawer key={slot.id} slot={slot} index={i} />
        ))}
      </group>
    </group>
  )
}
