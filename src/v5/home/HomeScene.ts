/**
 * Home 3D 장면 자리 — output/home-prototype 자료가 들어오면 구현한다.
 *
 * 들어올 자료
 * - output/visuals/v5-home-desk-background-v6.png : 정면 빈 화이트 책상 · 뒤 철제 수납장 · 왼쪽 블라인드 자연광
 * - output/visuals/v5-home-floor-plan.svg         : 책상·수납장·카메라 배치도('평면도' 보기)
 * - output/home-prototype/assets/imac.obj, table.obj, cabinet.glb (FileCabinet01.obj는 형상이 비어 있어 쓰지 않음)
 * - output/home-prototype/index.html               : 'Home 시안 / 3D 배치 / 평면도' 보기와 iMac 클릭 흐름 → 로더·카메라를 옮겨 온다
 *
 * 구현 순서
 * 1. 'composite': V6 배경을 화면에 깔고, 카메라 화각·위치를 사진에 맞춘다. 책상·수납장 모델은 visible=false,
 *    책상 윗면만 ShadowMaterial 평면으로 남겨 iMac·서류더미의 접촉 그림자를 사진 위에 떨어뜨린다.
 *    빛은 왼쪽 블라인드 방향의 DirectionalLight 하나 + 약한 환경광.
 * 2. 'layout': 배경을 빼고 책상(table.obj)·수납장(cabinet.glb)을 보이게 한다.
 * 3. 'plan': 평면도 SVG를 HTML로 보여 준다(3D와 별개).
 * 4. focusImac(): GSAP Timeline — iMac이 화면 앞으로 이동(0.7–0.9s) → onArrive에서 #resume 패널.
 *    모션 줄이기면 이동 없이 바로 패널.
 * 5. 서류더미(임시 형태) 클릭 → 맨 위 종이가 살짝 밀림 → #about.
 * 모델은 Home에 들어올 때만 동적 import로 불러온다(Work 장면과 같은 방식, three/loaders.ts 재사용).
 */
export type HomeMode = 'composite' | 'layout' | 'plan'

export interface HomeSceneHandle {
  setMode(mode: HomeMode): void
  /** iMac을 화면 앞으로 옮긴 뒤 onArrive */
  focusImac(onArrive: () => void): void
  /** 패널을 닫으면 원래 배치로 */
  reset(): void
  dispose(): void
}
