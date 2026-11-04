import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { MeshBasicMaterial, MeshPhysicalMaterial, Vector3, type Group, type Mesh, type PointLight } from 'three'
import { vinScreenTexture } from './vinScreen'
import { CRT_GLOW } from '../../config/home'
import { useHome } from '../../state/homeStore'
import LaptopModel, { SCREEN } from '../models/LaptopModel'
import { prefersReducedMotion } from '../pointer'
import { screenOverlay } from '../screenOverlay'

/** 커서 자리(화면 가운데 기준 -0.5~0.5): 프롬프트 글줄 끝 */
const CURSOR = { u: -0.5 + 0.27, v: -0.5 + 0.14 }
const CORNERS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
] as const
const corner = new Vector3()

/**
 * 노트북 + 켜진 화면(LCD). 매끈한 검은 유리 위에 은은한 발광, 커서가 깜빡이고 포인터를 올리면 조금 밝아진다.
 * 발광 세기는 CRT와 같은 CRT_GLOW 값을 쓴다(hotspot id도 'crt' 그대로 — ABOUT으로 가는 화면).
 */
export default function Laptop(props: ThreeElements['group']) {
  const tex = useMemo(() => vinScreenTexture({ width: 800, height: 500, crt: false }), [])
  const screen = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: '#05080b',
        roughness: 0.22,
        metalness: 0,
        envMapIntensity: 0.22,
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

  // 화면 가운데 기준 좌표계(앞면 +z). 이력서 HTML을 화면 네 모서리에 맞춰 겹친다
  const frame = useRef<Group>(null)
  useFrame(({ camera, size }) => {
    const el = screenOverlay.el
    const f = frame.current
    if (!el || !f) return
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -Infinity
    let y1 = -Infinity
    for (const [sx, sy] of CORNERS) {
      corner.set((sx * SCREEN.w) / 2, (sy * SCREEN.h) / 2, 0)
      f.localToWorld(corner).project(camera)
      const x = (corner.x * 0.5 + 0.5) * size.width
      const y = (-corner.y * 0.5 + 0.5) * size.height
      x0 = Math.min(x0, x)
      x1 = Math.max(x1, x)
      y0 = Math.min(y0, y)
      y1 = Math.max(y1, y)
    }
    el.style.transform = `translate3d(${x0.toFixed(1)}px, ${y0.toFixed(1)}px, 0)`
    el.style.width = `${(x1 - x0).toFixed(1)}px`
    el.style.height = `${(y1 - y0).toFixed(1)}px`
  })

  useFrame(({ clock }, dt) => {
    const { mode, hovered } = useHome.getState()
    const focus = mode === 'CAMERA_TRANSITION' || mode === 'ABOUT_OPEN'
    const goal = hovered === 'crt' ? CRT_GLOW.hover : focus ? CRT_GLOW.focus : CRT_GLOW.idle
    const k = 1 - Math.exp(-dt * CRT_GLOW.speed)
    glow.current += (goal - glow.current) * k
    screen.emissiveIntensity = glow.current
    if (cursor.current) cursor.current.visible = reduced || clock.elapsedTime % CRT_GLOW.blinkSec < CRT_GLOW.blinkSec / 2
    if (spill.current) {
      const s = hovered === 'crt' ? CRT_GLOW.spill.hoverIntensity : CRT_GLOW.spill.intensity
      spill.current.intensity += (s - spill.current.intensity) * k
    }
  })

  return (
    <group {...props}>
      <LaptopModel screen={screen}>
        <group ref={frame} />
        <mesh ref={cursor} material={cursorMat} position={[CURSOR.u * SCREEN.w, CURSOR.v * SCREEN.h, 0.0004]}>
          <planeGeometry args={[SCREEN.w * 0.014, SCREEN.h * 0.045]} />
        </mesh>
        {/* 화면 앞 은은한 푸른 반사광(키보드·책상) */}
        <pointLight ref={spill} position={[0, -0.03, 0.12]} color={CRT_GLOW.spill.color} intensity={CRT_GLOW.spill.intensity} distance={0.7} decay={2} />
      </LaptopModel>
    </group>
  )
}
