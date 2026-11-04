import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, SoftShadows } from '@react-three/drei'
import { EffectComposer, N8AO, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { ACESFilmicToneMapping } from 'three'
import { CAMERA } from '../../v2/config/scenes'
import { DESK } from '../../v2/config/layout'
import { SceneReadySignal } from '../../v2/scene/sceneReady'
import Lighting from '../../v2/scene/Lighting'
import Room from '../../v2/scene/objects/Room'
import WallCalendar from '../../v2/scene/objects/WallCalendar'
import FileCabinet from './objects/FileCabinet'
import { HOME_LAYOUT as L, HOME_LIGHTING, HOME_SHOT, SHADING } from '../config/home'
import HomeCameraRig from './HomeCameraRig'
import Hotspot from './Hotspot'
import AnchorProjector from './AnchorProjector'
import Laptop from './objects/Laptop'
import LampWithLight from './objects/LampWithLight'
import WindowPlant from './objects/WindowPlant'
import DustMotes from './objects/DustMotes'
import Shelf from './objects/Shelf'
import WallPosters from './objects/WallPosters'
import DeskModel from './models/DeskModel'
import { BookModel, FlipClockModel, NotebookModel, TelephoneModel } from './models/DeskProps'
import { Rug } from './objects/RoomExtras'

/** 누르기 쉽게 키운 보이지 않는 판정 영역 */
function HitArea({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  )
}

/** 휴대폰·태블릿: 상판 반사를 끄고 차폐 효과를 절반 해상도로 */
const isSmallDevice = () => window.matchMedia('(max-width: 768px), (pointer: coarse)').matches

/**
 * V4 HOME 장면. 오브제는 각각 따로 있고, 누를 수 있는 것만 <Hotspot>으로 감싼다.
 * 책상·노트북·소품·서랍장은 V4 절차 모델, 벽·바닥·창·달력은 V2를 재사용한다.
 * 빛: 창 햇빛(부드러운 PCSS 그림자) + 하늘·환경 반사 + 접촉 그림자 + 화면 공간 차폐(간접광 느낌) + 스탠드.
 * 서랍 속 파일(WORK)은 FileCabinet 안에서 Hotspot으로 감싼다. 전화기(CONTACT)는 후속 단계.
 */
export default function HomeCanvas() {
  const small = useMemo(() => isSmallDevice(), [])
  const S = SHADING
  const deskTop = DESK.height + 0.0012

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      gl={{ antialias: false, toneMapping: ACESFilmicToneMapping }}
      camera={{ fov: CAMERA.fov, near: 0.03, far: CAMERA.far, position: HOME_SHOT.position }}
    >
      <HomeCameraRig />
      <SceneReadySignal />
      <SoftShadows size={S.softShadows.size} samples={S.softShadows.samples} focus={S.softShadows.focus} />
      <Lighting preset={HOME_LIGHTING} />

      {/* 공간: 벽·바닥·창(V2), 선반·포스터 */}
      <Room floorColor={L.floorColor} />
      <Rug position={L.rug} />
      <WallPosters position={L.posters} />
      <WallCalendar position={L.calendar} scale={0.72} />
      <Shelf position={L.shelf} />
      <WindowPlant position={L.plant} />
      <DustMotes />

      {/* 가구: 뒷벽에 붙인 책상 + 책상 밑 서랍장(WORK). 의자는 없다 */}
      <DeskModel position={L.desk} reflect={!small} />
      <FileCabinet position={L.cabinet} />

      {/* 책상 위(home-layout.png): 뒤쪽 줄 스탠드 · 시계 · 노트북 · 전화기, 앞쪽 왼쪽 노트 · 책 */}
      <Hotspot id="crt">
        <Laptop position={L.laptop} />
      </Hotspot>
      <Hotspot id="lamp">
        <LampWithLight position={L.lamp} rotation-y={L.lampYaw} scale={0.82} />
        {/* 가는 팔 대신 스탠드 전체를 덮는 판정 영역(팔이 뻗는 로컬 +x 쪽) */}
        <group position={L.lamp} rotation-y={L.lampYaw} scale={0.82}>
          <HitArea position={[0.15, 0.32, 0]} size={[0.46, 0.66, 0.3]} />
        </group>
      </Hotspot>
      <FlipClockModel position={L.clock} rotation-y={0.08} scale={1.3} />
      <TelephoneModel position={L.telephone} rotation-y={-0.12} />
      <NotebookModel position={L.notebook} rotation-y={0.04} />
      <BookModel position={L.book} rotation-y={0.06} size={[0.13, 0.024, 0.19]} cover="#a9b0b6" />

      {/* 접촉 그림자: 책상 위 사물 바닥 / 바닥 위 가구 다리 */}
      <ContactShadows
        position={[L.desk[0], deskTop, L.desk[2]]}
        scale={[DESK.width, DESK.depth]}
        resolution={1024}
        frames={1}
        opacity={S.contactDesk.opacity}
        blur={S.contactDesk.blur}
        far={S.contactDesk.far}
        color="#2a2118"
      />
      <ContactShadows
        position={[0.3, 0.002, -0.3]}
        scale={[4.4, 2.6]}
        resolution={1024}
        frames={1}
        opacity={S.contactFloor.opacity}
        blur={S.contactFloor.blur}
        far={S.contactFloor.far}
        color="#2a2118"
      />

      <AnchorProjector />

      <EffectComposer multisampling={0}>
        <N8AO aoRadius={S.ao.radius} intensity={S.ao.intensity} distanceFalloff={S.ao.distanceFalloff} halfRes={small} color="#2a2118" />
        <SMAA />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  )
}
