import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { MeshStandardMaterial, Object3D, type SpotLight } from 'three'
import LampModel from '../models/LampModel'
import { LAMP_LIGHT as L } from '../../config/home'
import { useHome } from '../../state/homeStore'

/** 휴대폰·태블릿은 그림자 맵을 줄인다 */
const isSmallDevice = () => window.matchMedia('(max-width: 768px), (pointer: coarse)').matches

/**
 * 노란 스탠드(V4 돔 갓 모델) + 전구 발광 + 책상 위 국소 조명(그림자 포함).
 * 이 조명만 켜고 끈다. 창 햇빛·환경광은 Lighting(V2)이 따로 맡아 그대로 유지된다.
 * 장면 조명은 모두 실시간이라 베이크된 조명과 겹치지 않는다(최종 에셋에 라이트맵을 구울 때는 스탠드 빛을 빼고 굽는다).
 * 광원은 꺼져 있어도 세기 0으로 남겨 둔다 — 켜고 끌 때 셰이더를 다시 만들지 않게.
 */
export default function LampWithLight(props: ThreeElements['group']) {
  const light = useRef<SpotLight>(null)
  const target = useMemo(() => new Object3D(), [])
  const bulb = useMemo(() => new MeshStandardMaterial({ color: '#fff6e6', emissive: L.color, emissiveIntensity: 0, roughness: 0.3 }), [])
  const inner = useMemo(
    () => new MeshStandardMaterial({ color: '#f3dca8', emissive: L.color, emissiveIntensity: 0, side: 1, roughness: 0.6 }),
    [],
  )
  useEffect(
    () => () => {
      bulb.dispose()
      inner.dispose()
    },
    [bulb, inner],
  )
  const level = useRef(L.startOn ? 1 : 0)
  const mapSize = useMemo(() => (isSmallDevice() ? 512 : 1024), [])

  useFrame((_, dt) => {
    const goal = useHome.getState().lampOn ? 1 : 0
    level.current += (goal - level.current) * (1 - Math.exp(-dt * L.fade))
    const v = level.current
    if (light.current) light.current.intensity = L.intensity * v
    bulb.emissiveIntensity = L.bulbGlow * v
    inner.emissiveIntensity = 0.9 * v
  })

  return (
    <LampModel {...props}>
      {/* 전구(켜지면 빛난다) + 갓 안쪽 반사면 */}
      <mesh material={bulb} position={[0, -0.1, 0]}>
        <sphereGeometry args={[0.024, 16, 12]} />
      </mesh>
      <mesh material={inner} position={[0, -0.074, 0]}>
        <coneGeometry args={[0.084, 0.1, 40, 1, true]} />
      </mesh>
      <primitive object={target} position={[0, -1, 0]} />
      <spotLight
        ref={light}
        position={[0, -0.115, 0]}
        target={target}
        color={L.color}
        intensity={L.startOn ? L.intensity : 0}
        distance={L.distance}
        angle={L.angle}
        penumbra={L.penumbra}
        decay={2}
        castShadow
        shadow-mapSize={[mapSize, mapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-near={0.03}
        shadow-camera-far={L.distance}
      />
    </LampModel>
  )
}
