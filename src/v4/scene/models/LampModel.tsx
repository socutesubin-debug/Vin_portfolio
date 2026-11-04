import { useEffect, useMemo, type ReactNode } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { LatheGeometry, Vector2 } from 'three'
import { v4Materials } from './materials'

/** 돔 갓 단면(바깥 → 말린 테두리 → 안쪽). 위가 +y, 열린 쪽이 -y */
function shadeGeometry() {
  const pts: [number, number][] = [
    [0.0, 0.07],
    [0.022, 0.068],
    [0.05, 0.05],
    [0.072, 0.018],
    [0.085, -0.02],
    [0.091, -0.045],
    [0.094, -0.049],
    [0.09, -0.047],
    [0.083, -0.022],
    [0.068, 0.014],
    [0.046, 0.044],
    [0.02, 0.06],
    [0.0, 0.062],
  ]
  return new LatheGeometry(
    pts.map(([x, y]) => new Vector2(x, y)),
    64,
  )
}

/**
 * 관절형 노란 스탠드(V4): 무게 있는 원형 받침 + 두 팔 + 돔 갓(위쪽 통풍구, 안쪽 흰 반사면) + 크롬 관절.
 * 팔·관절 배치는 V2 DeskLamp와 같다(팔은 로컬 +x로 뻗는다). children은 갓 안 전구 자리(갓 로컬 -y가 빛 방향).
 * [절차 모델]
 */
export default function LampModel({ children, ...props }: ThreeElements['group'] & { children?: ReactNode }) {
  const m = v4Materials()
  const shade = useMemo(() => shadeGeometry(), [])
  useEffect(() => () => shade.dispose(), [shade])

  const joint = (r = 0.014) => (
    <mesh material={m.chrome} castShadow>
      <sphereGeometry args={[r, 20, 14]} />
    </mesh>
  )

  return (
    <group {...props}>
      {/* 받침: 아래가 넓은 원판 + 위 작은 턱 */}
      <mesh position={[0, 0.011, 0]} material={m.paintYellow} castShadow receiveShadow>
        <cylinderGeometry args={[0.07, 0.085, 0.022, 48]} />
      </mesh>
      <mesh position={[0, 0.026, 0]} material={m.chrome} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 0.01, 24]} />
      </mesh>
      {/* 아래 팔 */}
      <group position={[0, 0.03, 0]} rotation-z={-0.3}>
        {joint()}
        <mesh position={[0, 0.2, 0]} material={m.paintYellow} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.4, 16]} />
        </mesh>
        {/* 위 팔 */}
        <group position={[0, 0.4, 0]} rotation-z={-0.75}>
          {joint()}
          <mesh position={[0, 0.16, 0]} material={m.paintYellow} castShadow>
            <cylinderGeometry args={[0.007, 0.007, 0.32, 16]} />
          </mesh>
          {/* 갓 */}
          <group position={[0, 0.32, 0]} rotation-z={1.75}>
            {joint(0.012)}
            <group position={[0, -0.075, 0]}>
              <mesh geometry={shade} material={m.paintYellow} castShadow receiveShadow />
              {/* 위쪽 통풍구(검은 슬롯 한 줄) */}
              {Array.from({ length: 14 }, (_, i) => (
                <group key={i} rotation-y={(i / 14) * Math.PI * 2}>
                  <mesh position={[0.046, 0.052, 0]} rotation-z={-0.75} material={m.blackPlastic}>
                    <boxGeometry args={[0.014, 0.0025, 0.0045]} />
                  </mesh>
                </group>
              ))}
              {/* 갓 꼭대기 크롬 마개 */}
              <mesh position={[0, 0.07, 0]} material={m.chrome}>
                <cylinderGeometry args={[0.012, 0.016, 0.01, 20]} />
              </mesh>
            </group>
            {children}
          </group>
        </group>
      </group>
    </group>
  )
}
