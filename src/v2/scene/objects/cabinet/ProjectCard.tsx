import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { ExtrudeGeometry, Shape, Vector3, type Group } from 'three'
import type { Project } from '../../../data/projects'
import { overlayOpen, useWorkspace } from '../../../state/workspaceStore'
import { cardTabTexture } from './materials'

const CARD = '#f6f2e9'
/** 마우스를 올렸을 때 올라오는 높이(참고 디자인 단위) */
const LIFT = 0.07
/** 클릭해서 뽑을 때 올라가는 높이. 이 근처에서 HTML 폴더로 이어진다 */
export const PULL = 0.45

export const CARD_THICKNESS = 0.006
export const CARD_TAB = { w: 0.36, h: 0.09, r: 0.022 }

interface Props {
  project: Project
  color: string
  /** 서랍 앞뒤 위치 */
  z: number
  tabX: number
  width: number
  height: number
  drawerIndex: number
  /** 뒤로 기댄 각도(rad) */
  lean: number
}

const setCursor = (on: boolean) => {
  document.body.style.cursor = on ? 'pointer' : ''
}

/** 본체와 둥근 탭이 한 장으로 이어진 인덱스 카드 윤곽 */
function cardShape(w: number, h: number, tabX: number) {
  const { w: tw, h: th, r } = CARD_TAB
  const x0 = tabX - tw / 2
  const x1 = tabX + tw / 2
  const s = new Shape()
  s.moveTo(-w / 2, 0)
  s.lineTo(w / 2, 0)
  s.lineTo(w / 2, h)
  s.lineTo(x1, h)
  s.lineTo(x1, h + th - r)
  s.quadraticCurveTo(x1, h + th, x1 - r, h + th)
  s.lineTo(x0 + r, h + th)
  s.quadraticCurveTo(x0, h + th, x0, h + th - r)
  s.lineTo(x0, h)
  s.lineTo(-w / 2, h)
  s.closePath()
  return s
}

const tmp = new Vector3()

/**
 * 서랍에 꽂힌 프로젝트 인덱스 카드. 탭에 이름·연도.
 * 마우스를 올리면 살짝 올라오고, 클릭하면 위로 뽑혀 올라가며 HTML 폴더 미리보기로 이어진다.
 */
export default function ProjectCard({ project, color, z, tabX, width, height, drawerIndex, lean }: Props) {
  const lifted = useRef<Group>(null)
  const lift = useRef(0)
  const hovered = useRef(false)
  const gl = useThree((s) => s.gl)

  const geo = useMemo(() => {
    const g = new ExtrudeGeometry(cardShape(width, height, tabX), { depth: CARD_THICKNESS, bevelEnabled: false })
    g.translate(0, 0, -CARD_THICKNESS / 2)
    return g
  }, [width, height, tabX])
  const tex = useMemo(
    () => cardTabTexture(project.tab ?? project.title, project.year, color),
    [project.tab, project.title, project.year, color],
  )
  useEffect(
    () => () => {
      geo.dispose()
      tex.dispose()
    },
    [geo, tex],
  )

  useFrame((_, dt) => {
    const g = lifted.current
    if (!g) return
    const pulled = useWorkspace.getState().pulled?.id === project.id
    const target = pulled ? PULL : hovered.current ? LIFT : 0
    lift.current += (target - lift.current) * (1 - Math.exp(-dt * (pulled ? 12 : 10)))
    g.position.y = lift.current
    // 뽑혀 올라가면 HTML 폴더가 이어받으므로 3D 카드는 숨긴다
    g.visible = !(pulled && lift.current > PULL * 0.55)
  })

  // 서랍이 열려 있고 2D 화면이 떠 있지 않을 때만 반응한다
  const active = () => {
    const s = useWorkspace.getState()
    return s.activeScene === 'work' && s.openDrawer === drawerIndex && !overlayOpen(s)
  }

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!active() || e.pointerType !== 'mouse') return
    e.stopPropagation()
    hovered.current = true
    setCursor(true)
  }
  const onOut = () => {
    if (!hovered.current) return
    hovered.current = false
    setCursor(false)
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!active()) return
    e.stopPropagation()
    hovered.current = false
    setCursor(false)
    // 다 뽑혀 올라간 탭 위치를 화면 좌표로 바꿔, 폴더가 그 자리에서 날아오게 한다
    const parent = lifted.current?.parent
    if (!parent) return
    parent.localToWorld(tmp.set(tabX, height + PULL + CARD_TAB.h / 2, 0)).project(e.camera)
    const rect = gl.domElement.getBoundingClientRect()
    const origin = { x: rect.left + ((tmp.x + 1) / 2) * rect.width, y: rect.top + ((1 - tmp.y) / 2) * rect.height }
    useWorkspace.getState().pull({ id: project.id, origin })
  }

  return (
    // 기댄 방향 그대로 빠져나오도록 기울기는 바깥 그룹에 준다
    <group position={[0, 0, z]} rotation-x={-lean}>
      <group ref={lifted} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
        <mesh geometry={geo} castShadow receiveShadow>
          <meshStandardMaterial color={CARD} roughness={0.8} />
        </mesh>
        <mesh position={[tabX, height + CARD_TAB.h * 0.47, CARD_THICKNESS / 2 + 0.0005]}>
          <planeGeometry args={[CARD_TAB.w * 0.9, CARD_TAB.h * 0.86]} />
          <meshStandardMaterial map={tex} roughness={0.8} />
        </mesh>
      </group>
    </group>
  )
}
