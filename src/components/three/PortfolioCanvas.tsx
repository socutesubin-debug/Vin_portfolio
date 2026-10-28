import { Component, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, PerformanceMonitor } from '@react-three/drei'
import { ACESFilmicToneMapping, PMREMGenerator } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import Cabinet from './Cabinet'
import CameraRig from './CameraRig'
import BusinessCardObject from './BusinessCardObject'
import ResumePaper from './ResumePaper'
import ProjectFiles from './ProjectFiles'
import TelephoneObject from './TelephoneObject'
import { TABLETOP_Y } from '../../animations/stages'
import { rig } from '../../animations/rig'
import { useExperience } from '../../state/experienceStore'

/** WebGL 초기화/런타임 오류 시 스토어를 fallback 모드로 전환한다. */
class CanvasBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: unknown) {
    console.error('[VIN] 3D scene failed, switching to fallback', err)
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** 시안과 같은 스튜디오 환경(RoomEnvironment)을 반사/주변광으로 쓴다. 외부 HDR 파일이 필요 없다. */
function StudioEnvironment() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    const target = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = target.texture
    scene.environmentIntensity = 0.32 // 시안 대비 도장색이 날아가지 않도록 반사/주변광을 낮춘다
    return () => {
      scene.environment = null
      target.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

function Lights() {
  return (
    <>
      <StudioEnvironment />
      <hemisphereLight args={[0xffffff, 0xbbbbbb, 0.18]} />
      {/* 키 라이트는 좌측 뒤 위쪽: 서랍 앞판 그림자가 내용물을 덮지 않고 앞쪽으로 떨어진다 */}
      <directionalLight
        position={[-2.6, 6, -1.4]}
        intensity={0.85}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2.6}
        shadow-camera-bottom={-1.4}
      />
    </>
  )
}

/** 렌더 루프가 멈춘(demand) 동안 Focus 변화 등 필요한 순간에만 다시 그린다. */
function DemandInvalidator() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(
    () =>
      useExperience.subscribe((s, prev) => {
        if (s.focus !== prev.focus || s.hovered !== prev.hovered) invalidate()
      }),
    [invalidate],
  )
  return null
}

/**
 * paused: 프로젝트 상세(전체 화면 문서)가 열려 있으면 렌더를 완전히 멈춘다.
 * focusOpen: 흐림 오버레이 아래에서는 매 프레임 그리지 않고 필요할 때만 그린다(성능).
 */
export default function PortfolioCanvas({ paused, focusOpen }: { paused: boolean; focusOpen: boolean }) {
  const setWebgl = useExperience((s) => s.setWebgl)
  const [dpr, setDpr] = useState(1.75)
  return (
    <CanvasBoundary onError={() => setWebgl(false)}>
      <Canvas
        className="scene-canvas"
        shadows="percentage"
        dpr={[1, dpr]}
        frameloop={paused ? 'never' : focusOpen ? 'demand' : 'always'}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        camera={{ fov: 30, near: 0.1, far: 40, position: [0, 1, 6.2] }}
        aria-hidden="true"
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <DemandInvalidator />
        <Lights />
        <CameraRig />
        <Suspense fallback={null}>
          <Cabinet
            top={
              <group position={[0.24, TABLETOP_Y + 0.002, 0.02]} rotation={[0, 0.34, 0]}>
                <BusinessCardObject id="card:home" context="home" canInteract={() => rig.shift > 0.95 && rig.about < 0.05} />
              </group>
            }
            about={<ResumePaper />}
            work={<ProjectFiles />}
            contact={<TelephoneObject />}
          />
        </Suspense>
        <ContactShadows position={[0, 0.001, 0]} scale={5} blur={2.4} far={2.2} opacity={0.45} resolution={512} />
      </Canvas>
    </CanvasBoundary>
  )
}
