import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import type { DirectionalLight } from 'three'
import { ACTIVE_LIGHTING, LIGHTING } from '../config/lighting'

/** 휴대폰·태블릿은 그림자 맵을 줄여 부드럽게 돌린다 */
const isSmallDevice = () => window.matchMedia('(max-width: 768px), (pointer: coarse)').matches

/**
 * 조명: config/lighting.ts의 프리셋을 그대로 배치한다.
 * - 창밖 햇살(그림자를 만드는 유일한 빛) + 하늘 환경광 + 그림자 없는 보조광
 * - 금속 반사용 환경맵: 창 모양 밝은 면과 천장 반사를 한 번만 렌더한다
 */
export default function Lighting() {
  const p = LIGHTING[ACTIVE_LIGHTING]
  const sun = useRef<DirectionalLight>(null)
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const mapSize = useMemo(() => (isSmallDevice() ? 1024 : 2048), [])

  useEffect(() => {
    gl.toneMappingExposure = p.exposure
  }, [gl, p.exposure])

  // 햇살 방향: 창밖 위치 → target
  useEffect(() => {
    const light = sun.current
    if (!light) return
    light.target.position.set(...p.sun.target)
    scene.add(light.target)
    return () => {
      scene.remove(light.target)
    }
  }, [scene, p.sun.target])

  return (
    <>
      <color attach="background" args={[p.background]} />
      <hemisphereLight args={[p.sky.color, p.sky.ground, p.sky.intensity]} />
      <directionalLight position={p.fill.position} color={p.fill.color} intensity={p.fill.intensity} />
      <directionalLight
        ref={sun}
        position={p.sun.position}
        color={p.sun.color}
        intensity={p.sun.intensity}
        castShadow
        shadow-mapSize={[mapSize, mapSize]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-radius={p.sun.softness}
        // 그림자 범위: 방 전체(뒷벽 윗부분까지)를 덮어야 한다. 좁으면 범위 밖이 "빛을 받는 곳"으로 처리된다
        shadow-camera-left={-4.6}
        shadow-camera-right={4.6}
        shadow-camera-top={4.6}
        shadow-camera-bottom={-4.6}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
      />

      <Environment frames={1} resolution={256} environmentIntensity={p.reflections.intensity}>
        {/* 바탕: 따뜻한 실내 톤(검게 비치지 않게) */}
        <color attach="background" args={[p.reflections.base]} />
        {/* 창: 왼쪽에서 들어오는 큰 밝은 면 */}
        <Lightformer
          form="rect"
          color={p.reflections.window.color}
          intensity={p.reflections.window.intensity}
          position={[-5, 2, -0.2]}
          rotation-y={Math.PI / 2}
          scale={[3.4, 3.6, 1]}
        />
        {/* 천장·벽에서 돌아오는 은은한 빛 */}
        <Lightformer form="rect" color={p.reflections.room.color} intensity={p.reflections.room.intensity} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" color={p.reflections.room.color} intensity={p.reflections.room.intensity * 0.6} position={[4, 2, 2]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="rect" color={p.reflections.room.color} intensity={p.reflections.room.intensity * 0.5} position={[0, 2, 5]} rotation-y={Math.PI} scale={[8, 4, 1]} />
      </Environment>
    </>
  )
}
