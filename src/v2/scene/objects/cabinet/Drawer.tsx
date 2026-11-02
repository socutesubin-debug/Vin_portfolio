import { useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import type { Group } from 'three'
import { CAB, CAB_N, DRAWER_MOTION as M, type DrawerSlot } from '../../../config/cabinet'
import { overlayOpen, useWorkspace } from '../../../state/workspaceStore'
import DrawerHandle from './DrawerHandle'
import FileContents from './FileContents'
import { paint, paintIn } from './materials'

const { W, D, BASE, DH } = CAB
const FW = W - 0.05
const FH = DH - 0.03
/** 서랍 상자 깊이·높이 */
const BD = D - 0.08
const BH = FH * 0.7
/** 서랍 상자 중심(앞뒤) */
const ZC = D / 2 - 0.025 - BD / 2
const WALL = 0.012

const setCursor = (on: boolean) => {
  document.body.style.cursor = on ? 'pointer' : ''
}

/**
 * 서랍 하나. 앞판(라벨·손잡이)에 마우스를 올리면 살짝 나오고 클릭하면 열린다.
 * 잠긴 서랍은 클릭하면 덜컥 흔들리기만 한다.
 */
export default function Drawer({ slot, index }: { slot: DrawerSlot; index: number }) {
  const y0 = BASE + (CAB_N - 1 - index) * DH
  const yc = y0 + DH / 2
  const by = y0 + 0.02

  const group = useRef<Group>(null)
  const pos = useRef(0)
  const hovered = useRef(false)
  const rattleAt = useRef(-1)
  const clock = useThree((s) => s.clock)
  const isOpen = useWorkspace((s) => s.openDrawer === index)

  useFrame((_, dt) => {
    const target = isOpen ? M.open : hovered.current && !slot.locked ? M.hover : 0
    pos.current += (target - pos.current) * (1 - Math.exp(-dt * M.speed))
    let z = pos.current
    let ry = 0
    if (rattleAt.current >= 0) {
      const t = clock.elapsedTime - rattleAt.current
      if (t > 0.7) rattleAt.current = -1
      else {
        // 덜컥: 당겨졌다가 걸려서 튕기듯 몇 번 흔들리고 멈춘다
        const decay = Math.exp(-t * 6)
        z += M.rattle * Math.abs(Math.sin(t * 26)) * decay
        ry = 0.02 * Math.sin(t * 41) * decay
      }
    }
    if (group.current) {
      group.current.position.z = z
      group.current.rotation.y = ry
    }
  })

  // WORK 장면이고 2D 화면(폴더·그리드·상세)이 떠 있지 않을 때만 반응한다
  const active = () => {
    const s = useWorkspace.getState()
    return s.activeScene === 'work' && !overlayOpen(s)
  }

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!active()) return
    e.stopPropagation()
    if (e.pointerType === 'mouse') hovered.current = true
    setCursor(true)
  }
  const onOut = () => {
    hovered.current = false
    setCursor(false)
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!active()) return
    e.stopPropagation()
    if (slot.locked) {
      rattleAt.current = clock.elapsedTime
      return
    }
    const s = useWorkspace.getState()
    s.setOpenDrawer(s.openDrawer === index ? null : index)
  }

  return (
    <group ref={group}>
      {/* 앞판 + 라벨·손잡이: 여기만 클릭/hover에 반응 */}
      <group onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
        <RoundedBox args={[FW, FH, 0.03]} radius={0.012} smoothness={4} position={[0, yc, D / 2 - 0.01]} material={paint} castShadow receiveShadow />
        <RoundedBox args={[FW - 0.06, FH - 0.06, 0.01]} radius={0.02} smoothness={4} position={[0, yc, D / 2 + 0.006]} material={paint} castShadow />
        <group position={[0, yc + 0.025, D / 2 + 0.011]}>
          <DrawerHandle label={slot.label} />
        </group>
      </group>

      {/* 서랍 상자 */}
      <mesh material={paintIn} position={[-FW / 2 + 0.03, by + BH / 2, ZC]} castShadow receiveShadow>
        <boxGeometry args={[WALL, BH, BD]} />
      </mesh>
      <mesh material={paintIn} position={[FW / 2 - 0.03, by + BH / 2, ZC]} castShadow receiveShadow>
        <boxGeometry args={[WALL, BH, BD]} />
      </mesh>
      <mesh material={paintIn} position={[0, by + BH / 2, ZC - BD / 2]} castShadow receiveShadow>
        <boxGeometry args={[FW - 0.06, BH, WALL]} />
      </mesh>
      <mesh material={paintIn} position={[0, by, ZC]} receiveShadow>
        <boxGeometry args={[FW - 0.06, 0.01, BD]} />
      </mesh>

      {slot.contents === 'projects' && (
        // 상자 안쪽: 뒷판 안쪽면 ~ 앞판 뒷면
        <group position={[0, by + 0.005, (ZC - BD / 2 + WALL / 2 + (D / 2 - 0.025)) / 2]}>
          <FileContents
            drawerIndex={index}
            width={FW - 0.06 - WALL * 2}
            depth={D / 2 - 0.025 - (ZC - BD / 2 + WALL / 2)}
            height={BH}
          />
        </group>
      )}
    </group>
  )
}
