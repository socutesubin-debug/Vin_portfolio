import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { MeshBasicMaterial, MeshPhysicalMaterial, type Mesh, type PointLight } from 'three'
import { vinScreenTexture } from './vinScreen'
import { CRT_GLOW } from '../../config/home'
import { useHome } from '../../state/homeStore'
import CrtModel, { GLASS } from '../models/CrtModel'
import { prefersReducedMotion } from '../pointer'

/** 커서 자리(유리 가운데 기준 -0.5~0.5) */
const CURSOR = { u: -0.5 + 0.345, v: -0.5 + 0.135 }

/**
 * 레트로 컴퓨터(V4 절차 모델) + 켜진 화면.
 * 화면은 절제된 유리 반사(볼록한 유리, 낮은 환경 반사) 위에 은은한 발광. 커서가 깜빡이고, 포인터를 올리면 조금 밝아진다.
 */
export default function CrtMonitor(props: ThreeElements['group']) {
  const tex = useMemo(() => vinScreenTexture(), [])
  const screen = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: '#05080b',
        // 거칠기를 조금 올려 창 반사가 점으로 맺히지 않고 넓게 번진다
        roughness: 0.32,
        metalness: 0,
        envMapIntensity: 0.18,
        specularIntensity: 0.5,
        emissive: '#ffffff',
        emissiveMap: tex,
        emissiveIntensity: CRT_GLOW.idle,
      }),
    [tex],
  )
  const cursorMat = useMemo(() => new MeshBasicMaterial({ color: '#f2efe6', toneMapped: false }), [])
  useEffect(
    () => () => {
      tex.dispose()
      screen.dispose()
      cursorMat.dispose()
    },
    [tex, screen, cursorMat],
  )
  const cursor = useRef<Mesh>(null)
  const spill = useRef<PointLight>(null)
  const glow = useRef(CRT_GLOW.idle)
  const reduced = useMemo(() => prefersReducedMotion(), [])

  useFrame(({ clock }, dt) => {
    const { mode, hovered } = useHome.getState()
    const focus = mode === 'CAMERA_TRANSITION' || mode === 'ABOUT_OPEN'
    const goal = hovered === 'crt' ? CRT_GLOW.hover : focus ? CRT_GLOW.focus : CRT_GLOW.idle
    const k = 1 - Math.exp(-dt * CRT_GLOW.speed)
    // 아주 작은 깜빡임(브라운관 느낌). 움직임 줄이기면 생략
    const flicker = reduced ? 0 : Math.sin(clock.elapsedTime * 47) * 0.012
    glow.current += (goal - glow.current) * k
    screen.emissiveIntensity = glow.current + flicker
    if (cursor.current) cursor.current.visible = reduced || clock.elapsedTime % CRT_GLOW.blinkSec < CRT_GLOW.blinkSec / 2
    if (spill.current) {
      const s = hovered === 'crt' ? CRT_GLOW.spill.hoverIntensity : CRT_GLOW.spill.intensity
      spill.current.intensity += (s - spill.current.intensity) * k
    }
  })

  const [cx, cy, cz] = GLASS.center

  return (
    <group {...props}>
      <CrtModel screen={screen} />
      {/* 프롬프트 뒤 깜빡이는 커서(볼록한 유리 표면 위) */}
      <mesh
        ref={cursor}
        material={cursorMat}
        position={[cx + CURSOR.u * GLASS.w, cy + CURSOR.v * GLASS.h, cz + GLASS.bulgeAt(CURSOR.u, CURSOR.v) + 0.0007]}
      >
        <planeGeometry args={[GLASS.w * 0.022, GLASS.h * 0.05]} />
      </mesh>
      {/* 화면 앞 은은한 푸른 반사광(키보드·책상) */}
      <pointLight ref={spill} position={[cx, cy - 0.05, cz + 0.14]} color={CRT_GLOW.spill.color} intensity={CRT_GLOW.spill.intensity} distance={0.8} decay={2} />
    </group>
  )
}
