import { useEffect, useMemo } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { CanvasTexture, MeshStandardMaterial, SRGBColorSpace } from 'three'
import { FINISH } from '../../config/layout'
import { useWorkspace } from '../../state/workspaceStore'

/** 본체 높이와 CRT 크기(m). 화면 가운데 높이 = BASE.h + CRT.h / 2 (ABOUT 카메라가 여기를 본다) */
const BASE = { w: 0.44, h: 0.11, d: 0.4 }
const CRT = { w: 0.38, h: 0.34, d: 0.26 }
const SCREEN = { w: 0.29, h: 0.215 }
export const SCREEN_Y = BASE.h + CRT.h / 2

const beige = new MeshStandardMaterial({ color: FINISH.beige, roughness: 0.55 })
const beigeDark = new MeshStandardMaterial({ color: FINISH.beigeDark, roughness: 0.6 })
const slot = new MeshStandardMaterial({ color: '#2a2a2c', roughness: 0.7 })

/** 켜진 화면(ABOUT): 검은 화면에 VIN 로고와 안내 줄. 실제 소개 내용은 ABOUT 단계에서 바꾼다 */
function screenTexture() {
  const c = document.createElement('canvas')
  c.width = 640
  c.height = 480
  const ctx = c.getContext('2d')!
  const draw = () => {
    ctx.fillStyle = '#0c0d0d'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.fillStyle = '#f2efe6'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = "400 132px 'Bodoni Moda', 'Didot', Georgia, serif"
    ctx.fillText('VIN', c.width / 2, c.height * 0.44)
    ctx.font = "500 26px Inter, 'Helvetica Neue', Arial, sans-serif"
    ctx.fillStyle = 'rgba(242, 239, 230, 0.7)'
    ctx.fillText('A B O U T', c.width / 2, c.height * 0.66)
    ctx.fillText('▍', c.width / 2 + 80, c.height * 0.66)
    // 주사선
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'
    for (let y = 0; y < c.height; y += 4) ctx.fillRect(0, y, c.width, 1.5)
  }
  draw()
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  // 웹폰트가 늦게 오면 한 번 더 그린다
  document.fonts?.ready.then(() => {
    draw()
    t.needsUpdate = true
  })
  return t
}

/**
 * 레트로 컴퓨터: 베이지 본체 + 그 위 CRT 모니터.
 * 평소에는 화면이 꺼진 어두운 유리이고, ABOUT 장면에 오면 부드럽게 켜진다.
 * 원점은 책상 위 본체 바닥 가운데. 키보드·마우스는 따로 둔다.
 */
export default function RetroComputer(props: ThreeElements['group']) {
  const tex = useMemo(() => screenTexture(), [])
  const glass = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#1a1c1b',
        roughness: 0.18,
        metalness: 0.1,
        emissive: '#ffffff',
        emissiveMap: tex,
        emissiveIntensity: 0,
      }),
    [tex],
  )
  useEffect(
    () => () => {
      tex.dispose()
      glass.dispose()
    },
    [tex, glass],
  )

  // ABOUT에서만 화면을 켠다
  useFrame((_, dt) => {
    const on = useWorkspace.getState().activeScene === 'about' ? 1.25 : 0
    glass.emissiveIntensity += (on - glass.emissiveIntensity) * (1 - Math.exp(-dt * 3))
  })

  const zFront = CRT.d / 2 - 0.02

  return (
    <group {...props}>
      {/* 본체 */}
      <RoundedBox args={[BASE.w, BASE.h, BASE.d]} radius={0.008} smoothness={3} position={[0, BASE.h / 2, 0]} material={beige} castShadow receiveShadow />
      {/* 본체 앞면: 플로피 드라이브 두 칸 + 통풍구 + 전원 */}
      {[0.026, -0.012].map((y) => (
        <mesh key={y} material={slot} position={[0.09, BASE.h / 2 + y, BASE.d / 2 + 0.001]}>
          <boxGeometry args={[0.15, 0.008, 0.002]} />
        </mesh>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} material={beigeDark} position={[-0.12, BASE.h / 2 + 0.03 - i * 0.012, BASE.d / 2 + 0.001]}>
          <boxGeometry args={[0.12, 0.004, 0.002]} />
        </mesh>
      ))}
      <mesh position={[0.19, BASE.h / 2 - 0.03, BASE.d / 2 + 0.002]}>
        <boxGeometry args={[0.012, 0.004, 0.002]} />
        <meshStandardMaterial color="#5fbf6a" emissive="#5fbf6a" emissiveIntensity={0.8} />
      </mesh>

      {/* CRT: 앞쪽 하우징 + 뒤로 좁아지는 몸통 */}
      <group position={[0, BASE.h, 0.02]}>
        <RoundedBox args={[CRT.w, CRT.h, CRT.d]} radius={0.014} smoothness={3} position={[0, CRT.h / 2, 0]} material={beige} castShadow receiveShadow />
        <RoundedBox args={[CRT.w * 0.74, CRT.h * 0.78, 0.18]} radius={0.02} smoothness={3} position={[0, CRT.h * 0.47, -CRT.d / 2 - 0.07]} material={beige} castShadow />
        {/* 화면 테두리(살짝 들어간 베젤) + 유리 */}
        <mesh material={beigeDark} position={[0, CRT.h / 2 + 0.012, zFront + 0.021]}>
          <planeGeometry args={[SCREEN.w + 0.03, SCREEN.h + 0.03]} />
        </mesh>
        <mesh material={glass} position={[0, CRT.h / 2 + 0.012, zFront + 0.022]}>
          <planeGeometry args={[SCREEN.w, SCREEN.h]} />
        </mesh>
        {/* 화면 아래 조작부 */}
        <mesh material={beigeDark} position={[0, 0.03, zFront + 0.021]}>
          <boxGeometry args={[CRT.w - 0.06, 0.022, 0.002]} />
        </mesh>
        {[0.12, 0.145].map((x) => (
          <mesh key={x} material={slot} position={[x, 0.03, zFront + 0.024]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.006, 0.006, 0.004, 14]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
