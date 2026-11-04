import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping } from 'three'
import { CAMERA, SCENES } from '../config/scenes'
import { PLACEMENT } from '../config/layout'
import CameraRig from './CameraRig'
import { SceneReadySignal } from './sceneReady'
import Lighting from './Lighting'
import Room from './objects/Room'
import Desk from './objects/Desk'
import Chair from './objects/Chair'
import RetroComputer from './objects/RetroComputer'
import FlipClock from './objects/FlipClock'
import PenHolder from './objects/PenHolder'
import Plant from './objects/Plant'
import WallCalendar from './objects/WallCalendar'
import Keyboard from './objects/Keyboard'
import Mouse from './objects/Mouse'
import DeskLamp from './objects/DeskLamp'
import BusinessCard from './objects/BusinessCard'
import Telephone from './objects/Telephone'
import Notebook from './objects/Notebook'
import Mug from './objects/Mug'
import HiddenKey from './objects/HiddenKey'
import DrawerCabinet from './objects/DrawerCabinet'

/** 작업실 장면. 오브젝트는 각 컴포넌트를 GLB 버전으로 바꾸면 그대로 교체된다 */
export default function WorkspaceCanvas() {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}
      camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far, position: SCENES.home.position }}
    >
      <CameraRig />
      <SceneReadySignal />
      <Lighting />

      <Room />
      <Plant position={PLACEMENT.plant} />
      <WallCalendar position={PLACEMENT.calendar} />
      <Desk position={PLACEMENT.desk} />
      <DrawerCabinet position={PLACEMENT.cabinet} />
      {/* 책상에서 빠져 비스듬히 돌아간 채 — "잠시 자리를 비운" 느낌 */}
      <Chair position={PLACEMENT.chair} rotation-y={0.6} />

      {/* 주인공: 레트로 컴퓨터(ABOUT에서 화면이 켜진다) */}
      <RetroComputer position={PLACEMENT.computer} />
      <Keyboard position={PLACEMENT.keyboard} />
      <Mouse position={PLACEMENT.mouse} rotation-y={-0.12} />
      {/* 갓이 모니터를 가리지 않게 왼쪽 앞으로 뻗게 둔다 */}
      <DeskLamp position={PLACEMENT.lamp} rotation-y={-2.2} />
      <FlipClock position={PLACEMENT.clock} rotation-y={0.25} />
      <PenHolder position={PLACEMENT.penHolder} />
      <BusinessCard position={PLACEMENT.card} />
      {/* 주인공: 전화기(CONTACT 35도 장면) */}
      <Telephone position={PLACEMENT.telephone} rotation-y={-0.5} />

      {/* 작업 흔적 */}
      <Notebook position={PLACEMENT.notebook} rotation-y={0.18} />
      <Mug position={PLACEMENT.mug} rotation-y={2.4} />
      {/* 이스터에그: 몸통이 머그 밑으로 들어가게 머그 쪽을 향한다 */}
      <HiddenKey position={PLACEMENT.key} rotation-y={2.36} />
    </Canvas>
  )
}
