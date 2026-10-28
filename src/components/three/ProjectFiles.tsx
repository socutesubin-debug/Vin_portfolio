import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, MathUtils, MeshStandardMaterial, type Group, type Mesh } from 'three'
import { rig } from '../../animations/rig'
import { PROJECTS, PROJECT_ORDER, type ProjectSlug } from '../../data/projects'
import { useExperience } from '../../state/experienceStore'
import { trayAnchor } from './Cabinet'
import { useObjectInteraction } from './interaction'
import { tabTexture } from './textures'

const folderMat = new MeshStandardMaterial({ color: '#CFC8B6', roughness: 0.9, side: DoubleSide })
const paperMats = [
  new MeshStandardMaterial({ color: '#E4E1DA', roughness: 0.95, side: DoubleSide }),
  new MeshStandardMaterial({ color: '#D8D0BE', roughness: 0.95, side: DoubleSide }),
]

// 앞(PACKIT) → 뒤(LE LABO). 시안의 탭 위치를 따른다. z는 서랍이 열렸을 때 보이는 범위 안에 둔다.
const LAYOUT: Record<ProjectSlug, { z: number; tabX: number }> = {
  packit: { z: 0.38, tabX: 0 },
  printcafe: { z: 0.16, tabX: 0.2 },
  'le-labo': { z: -0.06, tabX: 0.26 },
}
const LEAN = -0.9
const W = 1.0
const H = 0.3

function ProjectFile({ slug, index }: { slug: ProjectSlug; index: number }) {
  const id = `file:${slug}`
  const lift = useRef<Group>(null)
  const tab = useRef<Mesh>(null)
  const openFocus = useExperience((s) => s.openFocus)
  const { label } = PROJECTS[slug]
  const tabMats = useMemo(
    () => [false, true].map((a) => new MeshStandardMaterial({ map: tabTexture(label, a), roughness: 0.85, side: DoubleSide })),
    [label],
  )
  const handlers = useObjectInteraction(id, () => rig.work > 0.85, (origin) =>
    openFocus({ type: 'project', slug }, origin, document.querySelector(`[data-opener="file-${slug}"]`)),
  )

  useFrame((_, dt) => {
    const s = useExperience.getState()
    const selected = s.focus.type === 'project' && s.focus.slug === slug
    const hovered = s.hovered === id
    // 스크롤 순차 강조(rig.fileHi)와 사용자 선택/hover를 구분한다.
    const scrollHi = rig.work > 0.9 && Math.abs(rig.fileHi - index) < 0.5
    const target = selected ? 0.22 : hovered ? 0.08 : scrollHi ? 0.22 : 0
    if (lift.current) {
      lift.current.position.y = s.reducedMotion ? target : MathUtils.damp(lift.current.position.y, target, 10, dt)
    }
    if (tab.current) tab.current.material = tabMats[hovered || selected || scrollHi ? 1 : 0]
  })

  const { z, tabX } = LAYOUT[slug]
  return (
    <group position={[0, 0, z]}>
      <group ref={lift}>
        <group rotation={[LEAN, 0, 0]} {...handlers}>
          {/* 뒤판 + 인덱스 탭 */}
          <mesh material={folderMat} position={[0, H / 2, 0]} castShadow receiveShadow>
            <planeGeometry args={[W, H]} />
          </mesh>
          <mesh ref={tab} material={tabMats[0]} position={[tabX, H + 0.032, 0]}>
            <planeGeometry args={[0.3, 0.066]} />
          </mesh>
          {/* 속지 */}
          <mesh material={paperMats[0]} position={[-0.02, H * 0.46, 0.008]}>
            <planeGeometry args={[W * 0.92, H * 0.9]} />
          </mesh>
          <mesh material={paperMats[1]} position={[0.03, H * 0.43, 0.014]}>
            <planeGeometry args={[W * 0.9, H * 0.84]} />
          </mesh>
          {/* 앞판 */}
          <mesh material={folderMat} position={[0, H * 0.38, 0.022]} castShadow receiveShadow>
            <planeGeometry args={[W, H * 0.76]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

/** 둘째 서랍(Work) 속 프로젝트 파일 3개 */
export default function ProjectFiles() {
  const [x, y, z] = trayAnchor('work')
  return (
    <group position={[x, y + 0.01, z]}>
      {PROJECT_ORDER.map((slug, i) => (
        <ProjectFile key={slug} slug={slug} index={i} />
      ))}
    </group>
  )
}
