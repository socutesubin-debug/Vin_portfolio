import { useEffect, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { MeshStandardMaterial, type BufferGeometry, type Group, type Mesh } from 'three'
import { rig } from '../../animations/rig'
import { DRAWER, DRAWERS, INTRO, type DrawerKey } from '../../animations/stages'
import { useExperience } from '../../state/experienceStore'

export const CABINET_URL = '/models/cabinet_v3.glb'

type CabinetNodes = Record<'body' | 'drawer1' | 'drawer2' | 'drawer3', Mesh>

// 서랍 안쪽 트레이(GLB의 서랍은 앞판만 있으므로 내부 상자를 덧붙인다)
const trayMaterial = new MeshStandardMaterial({ color: '#2B2F7E', roughness: 0.62, metalness: 0.08 })
const trayFloorMaterial = new MeshStandardMaterial({ color: '#26296F', roughness: 0.78, metalness: 0.02 })

function DrawerTray({ y }: { y: readonly [number, number] }) {
  const { trayDepth: d, trayWidth: w, frontInnerZ, wall: t } = DRAWER
  const bottom = y[0] + 0.05
  const h = y[1] - y[0] - 0.12
  const zc = frontInnerZ - d / 2
  return (
    <group>
      <mesh material={trayFloorMaterial} position={[0, bottom, zc]} receiveShadow>
        <boxGeometry args={[w, t, d]} />
      </mesh>
      <mesh material={trayMaterial} position={[-w / 2 + t / 2, bottom + h / 2, zc]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d]} />
      </mesh>
      <mesh material={trayMaterial} position={[w / 2 - t / 2, bottom + h / 2, zc]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d]} />
      </mesh>
      <mesh material={trayMaterial} position={[0, bottom + h / 2, frontInnerZ - d + t / 2]} receiveShadow>
        <boxGeometry args={[w, h, t]} />
      </mesh>
      <mesh material={trayMaterial} position={[0, bottom + h / 2, frontInnerZ - t / 2 - 0.004]} receiveShadow>
        <boxGeometry args={[w, h, t]} />
      </mesh>
    </group>
  )
}

/** 트레이 바닥 중앙 좌표(서랍 로컬). 내용물 배치 기준점. */
export function trayAnchor(key: DrawerKey): [number, number, number] {
  const y = DRAWERS[key].y[0] + 0.05 + DRAWER.wall / 2
  return [0, y, DRAWER.frontInnerZ - DRAWER.trayDepth / 2 + 0.02]
}

/** GLB 노드의 위치·스케일(node transform)을 그대로 적용해 메시를 그린다 */
function Part({ mesh, name }: { mesh: Mesh; name?: string }) {
  return (
    <mesh
      name={name}
      geometry={mesh.geometry}
      material={mesh.material}
      position={mesh.position}
      quaternion={mesh.quaternion}
      scale={mesh.scale}
      castShadow
      receiveShadow
    />
  )
}

function Drawer({ k, nodes, children }: { k: DrawerKey; nodes: CabinetNodes; children?: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame(() => {
    if (ref.current) ref.current.position.z = rig[k] * DRAWER.openDistance
  })
  return (
    <group ref={ref} name={`Drawer_${k}`}>
      <Part mesh={nodes[DRAWERS[k].node]} />
      <DrawerTray y={DRAWERS[k].y} />
      {children}
    </group>
  )
}

/** 단일 서랍장 모델. 본체와 세 서랍은 독립 노드이며 모든 장면에서 같은 인스턴스를 사용한다. */
export default function Cabinet({ top, about, work, contact }: { top?: ReactNode; about?: ReactNode; work?: ReactNode; contact?: ReactNode }) {
  const { nodes } = useGLTF(CABINET_URL) as unknown as { nodes: CabinetNodes }
  const setModelReady = useExperience((s) => s.setModelReady)
  const root = useRef<Group>(null)

  useEffect(() => {
    // 노멀이 없는 모델이면 부드러운 노멀을 계산한다(v3는 노멀 포함)
    const seen = new Set<BufferGeometry>()
    for (const m of Object.values(nodes)) {
      if (!m?.geometry || seen.has(m.geometry)) continue
      seen.add(m.geometry)
      if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals()
    }
  }, [nodes])

  useEffect(() => setModelReady(), [setModelReady])

  useFrame(() => {
    const g = root.current
    if (!g) return
    // Entrance: 루트 그룹 전체가 화면 아래에서 수직 상승한다(서랍 개폐 Transform과 분리)
    g.position.y = -(1 - rig.rise) * INTRO.riseDistance
  })

  return (
    <group ref={root} name="CabinetRoot">
      <Part mesh={nodes.body} name="CabinetBody" />
      {top}
      <Drawer k="about" nodes={nodes}>
        {about}
      </Drawer>
      <Drawer k="work" nodes={nodes}>
        {work}
      </Drawer>
      <Drawer k="contact" nodes={nodes}>
        {contact}
      </Drawer>
    </group>
  )
}

useGLTF.preload(CABINET_URL)
