import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ACESFilmicToneMapping, PMREMGenerator } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { CAMERA, SCENES } from '../config/scenes'
import { PLACEMENT, ROOM } from '../config/layout'
import CameraRig from './CameraRig'
import Room from './objects/Room'
import Desk from './objects/Desk'
import Chair from './objects/Chair'
import Monitor from './objects/Monitor'
import Keyboard from './objects/Keyboard'
import Mouse from './objects/Mouse'
import DeskLamp from './objects/DeskLamp'
import BusinessCard from './objects/BusinessCard'
import Telephone from './objects/Telephone'
import DrawerCabinet from './objects/DrawerCabinet'

const [winX, winY] = ROOM.window.center

/** 크롬이 크롬답게 보이도록 주변 반사(RoomEnvironment). 다른 물체 밝기는 크게 안 바뀌게 약하게 쓴다 */
function Reflections() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    const target = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = target.texture
    scene.environmentIntensity = 0.35
    return () => {
      scene.environment = null
      target.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

/** 작업실 장면. 오브젝트는 각 컴포넌트를 GLB 버전으로 바꾸면 그대로 교체된다 */
export default function WorkspaceCanvas() {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far, position: SCENES.home.position }}
    >
      <color attach="background" args={[ROOM.colors.wall]} />
      <CameraRig />
      <Reflections />

      <hemisphereLight args={['#fffaf0', '#b8b0a4', 1.3]} />
      {/* 창문 쪽에서 들어오는 빛 */}
      <directionalLight
        position={[winX - 1.2, winY + 1.8, ROOM.wallZ - 2]}
        intensity={1.6}
        color="#fff4e2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      {/* 방문자 쪽 보조광: 벽과 서랍장 앞면을 밝힌다 */}
      <directionalLight position={[2, 2.5, 4]} intensity={1.1} />

      <Room />
      <Desk position={PLACEMENT.desk} />
      <DrawerCabinet position={PLACEMENT.cabinet} />
      <Chair position={PLACEMENT.chair} rotation-y={0.35} />
      <Monitor position={PLACEMENT.monitor} />
      <Keyboard position={PLACEMENT.keyboard} />
      <Mouse position={PLACEMENT.mouse} />
      {/* 갓이 모니터를 가리지 않게 왼쪽 앞으로 뻗게 둔다 */}
      <DeskLamp position={PLACEMENT.lamp} rotation-y={-2.2} />
      <BusinessCard position={PLACEMENT.card} />
      <Telephone position={PLACEMENT.telephone} rotation-y={-0.5} />
    </Canvas>
  )
}
