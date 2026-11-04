import { useEffect, useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { CatmullRomCurve3, MeshPhysicalMaterial, TubeGeometry, Vector3 } from 'three'
import { v4Materials } from './materials'

const SEAT_Y = 0.42
const W = 0.48
/** 등받이 뒤로 젖힌 각도(라디안) */
const RECLINE = 0.2
const BACK_H = 0.34

/**
 * 옆 프레임 곡선(한쪽): 좌판 앞 → 좌판 뒤 → 등받이 위. 앉는 방향이 -z, 등받이가 +z.
 */
function sideCurve(x: number) {
  const s = Math.sin(RECLINE)
  const c = Math.cos(RECLINE)
  const by = SEAT_Y + 0.05
  const bz = 0.23
  return new CatmullRomCurve3(
    [
      [x, SEAT_Y + 0.015, -0.24],
      [x, SEAT_Y - 0.005, -0.1],
      [x, SEAT_Y - 0.0, 0.12],
      [x, by, bz],
      [x, by + BACK_H * 0.5 * c, bz + BACK_H * 0.5 * s],
      [x, by + BACK_H * c, bz + BACK_H * s],
    ].map(([a, b, d]) => new Vector3(a, b, d)),
    false,
    'catmullrom',
    0.4,
  )
}

/** 팔걸이 받침: 옆 프레임에서 올라와 앞으로 뻗는 크롬 곡선 */
function armCurve(x: number) {
  return new CatmullRomCurve3(
    [
      [x, SEAT_Y + 0.01, 0.1],
      [x * 1.06, SEAT_Y + 0.12, 0.08],
      [x * 1.08, SEAT_Y + 0.2, 0.02],
      [x * 1.08, SEAT_Y + 0.21, -0.12],
    ].map(([a, b, d]) => new Vector3(a, b, d)),
  )
}

/** 가로로 주름 잡힌 가죽 쿠션 한 장(rows줄) */
function Tufted({ rows, w, h, depth, material }: { rows: number; w: number; h: number; depth: number; material: MeshPhysicalMaterial }) {
  const rh = h / rows
  return (
    <group>
      {Array.from({ length: rows }, (_, i) => (
        <RoundedBox
          key={i}
          args={[w, rh * 1.08, depth]}
          radius={Math.min(depth, rh) * 0.45}
          smoothness={4}
          position={[0, -h / 2 + rh * (i + 0.5), 0]}
          material={material}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  )
}

/**
 * 사무용 의자: 버건디 가죽(가로 주름 쿠션) + 크롬 옆 프레임·팔걸이 + 5발 크롬 받침과 검은 바퀴.
 * 원점은 바닥 가운데, 앉는 방향이 -z(책상 쪽), 등받이가 +z. [절차 모델]
 */
export default function ChairModel({ leather = '#5a1b1f', ...props }: ThreeElements['group'] & { leather?: string }) {
  const m = v4Materials()
  const leatherMat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: leather,
        roughness: 0.48,
        clearcoat: 0.35,
        clearcoatRoughness: 0.35,
        sheen: 0.4,
        sheenRoughness: 0.6,
        sheenColor: '#c98d84',
        bumpMap: m.textures.grain,
        bumpScale: 0.6,
      }),
    [leather, m],
  )
  const tubes = useMemo(
    () => [-1, 1].flatMap((sx) => [new TubeGeometry(sideCurve(sx * (W / 2 + 0.012)), 48, 0.011, 10), new TubeGeometry(armCurve(sx * (W / 2 + 0.012)), 24, 0.009, 10)]),
    [],
  )
  useEffect(
    () => () => {
      leatherMat.dispose()
      tubes.forEach((t) => t.dispose())
    },
    [leatherMat, tubes],
  )

  return (
    <group {...props}>
      {/* 좌판(가로 주름 4줄) */}
      <group position={[0, SEAT_Y + 0.03, -0.06]} rotation-x={-Math.PI / 2 + 0.04}>
        <Tufted rows={4} w={W} h={0.44} depth={0.06} material={leatherMat} />
      </group>
      {/* 등받이(가로 주름 5줄), 뒤로 젖힘 */}
      <group position={[0, SEAT_Y + 0.05, 0.23]} rotation-x={-RECLINE}>
        <group position={[0, BACK_H / 2 + 0.01, -0.012]}>
          <Tufted rows={5} w={W - 0.02} h={BACK_H} depth={0.05} material={leatherMat} />
        </group>
      </group>
      {/* 크롬 옆 프레임 + 팔걸이 받침 */}
      {tubes.map((g, i) => (
        <mesh key={i} geometry={g} material={m.chrome} castShadow />
      ))}
      {/* 팔걸이 가죽 패드 */}
      {[-1, 1].map((sx) => (
        <RoundedBox
          key={sx}
          args={[0.05, 0.026, 0.2]}
          radius={0.012}
          smoothness={3}
          position={[sx * (W / 2 + 0.012) * 1.08, SEAT_Y + 0.225, -0.05]}
          material={leatherMat}
          castShadow
        />
      ))}

      {/* 좌판 밑 기울기 장치 + 기둥 */}
      <RoundedBox args={[0.18, 0.04, 0.2]} radius={0.01} smoothness={2} position={[0, SEAT_Y - 0.03, -0.04]} material={m.blackPlastic} castShadow />
      <mesh position={[0, 0.27, -0.04]} material={m.chrome} castShadow>
        <cylinderGeometry args={[0.02, 0.024, 0.32, 24]} />
      </mesh>
      <mesh position={[0, 0.15, -0.04]} material={m.blackPlastic}>
        <cylinderGeometry args={[0.03, 0.03, 0.08, 24]} />
      </mesh>

      {/* 5발 크롬 받침 + 검은 바퀴 */}
      <group position={[0, 0, -0.04]}>
        <mesh position={[0, 0.095, 0]} material={m.chrome} castShadow>
          <cylinderGeometry args={[0.045, 0.05, 0.03, 24]} />
        </mesh>
        {Array.from({ length: 5 }, (_, i) => (
          <group key={i} rotation-y={(i / 5) * Math.PI * 2 + 0.3}>
            <mesh position={[0.16, 0.085, 0]} rotation-z={0.12} material={m.chrome} castShadow>
              <boxGeometry args={[0.3, 0.022, 0.034]} />
            </mesh>
            {/* 바퀴: 쌍바퀴 + 축 덮개 */}
            <group position={[0.3, 0.03, 0]}>
              <mesh position={[0, 0.035, 0]} material={m.blackPlastic}>
                <cylinderGeometry args={[0.012, 0.012, 0.03, 12]} />
              </mesh>
              {[-0.011, 0.011].map((z) => (
                <mesh key={z} position={[0, 0, z]} rotation-x={Math.PI / 2} material={m.blackPlastic} castShadow>
                  <cylinderGeometry args={[0.028, 0.028, 0.016, 20]} />
                </mesh>
              ))}
            </group>
          </group>
        ))}
      </group>
    </group>
  )
}
