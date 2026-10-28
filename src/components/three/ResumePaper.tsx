import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshStandardMaterial, type Group } from 'three'
import { rig } from '../../animations/rig'
import { useExperience } from '../../state/experienceStore'
import { trayAnchor } from './Cabinet'
import { Lift, useObjectInteraction } from './interaction'
import { resumeTexture } from './textures'

const ID = 'resume'

/** 첫째 서랍(About) 속 이력서 종이. 클릭 시 HTML 이력서가 열린다. */
export default function ResumePaper() {
  const openFocus = useExperience((s) => s.openFocus)
  const hidden = useExperience((s) => s.focus.type === 'resume')
  const material = useMemo(() => new MeshStandardMaterial({ map: resumeTexture(), roughness: 0.92 }), [])
  const handlers = useObjectInteraction(ID, () => rig.about > 0.85, (origin) =>
    openFocus({ type: 'resume' }, origin, document.querySelector('[data-opener="resume"]')),
  )
  const lift = useRef<Group>(null)
  // 스크롤 타임라인(rig.resume)이 이력서를 서랍 밖으로 들어 올리고 키운다. Hover Lift와는 부모/자식으로 분리.
  useFrame(() => {
    const g = lift.current
    if (!g) return
    g.position.y = rig.resume * 0.6
    g.scale.setScalar(1 + rig.resume * 0.7)
  })
  const [x, y, z] = trayAnchor('about')
  return (
    <group position={[x, y + 0.004, z + 0.1]}>
      <group ref={lift}>
        <Lift active={() => useExperience.getState().hovered === ID} amount={0.025}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={material} visible={!hidden} receiveShadow castShadow {...handlers}>
            <planeGeometry args={[0.8, 0.6]} />
          </mesh>
        </Lift>
      </group>
    </group>
  )
}
