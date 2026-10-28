# VIN — Immersive 3D Portfolio

**VIN (Vision Inside) · Explore to Evolve**

인디고 3단 서랍장 하나를 스크롤로 탐색하며 명함 → 이력서 → 프로젝트 → 연락처를 발견하는 인터랙티브 포트폴리오입니다.

- 개발 기준: [docs/VIN_3D_PORTFOLIO_GUIDE.md](docs/VIN_3D_PORTFOLIO_GUIDE.md) + Master Prompt v2.0 + 노션 와이어프레임 10장(대화로 전달됨)
- 실제 콘텐츠 확인 목록: [docs/TODO_CONTENT.md](docs/TODO_CONTENT.md)

## 실행

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # 타입 체크 + 프로덕션 빌드 (dist/)
npm run preview   # 빌드 결과 확인 (http://localhost:4173)
npm run lint      # oxlint
```

## 배포

```bash
npm run build      # dist/ 생성 (정적 파일)
npm run preview    # 배포본 로컬 확인
```

- `dist/`는 정적 사이트라 Vercel · Netlify · Cloudflare Pages 어디서나 올릴 수 있습니다. 빌드 명령 `npm run build`, 출력 폴더 `dist`.
- `/work/:slug` 직접 접근을 위한 SPA rewrite 설정이 들어 있습니다: `vercel.json`(Vercel), `public/_redirects`(Netlify · Cloudflare Pages).
- 사이트는 도메인 **루트**(예: `https://xxx.vercel.app/`)에 올리는 것을 전제로 합니다. GitHub Pages처럼 하위 경로에 올리려면 `vite.config.ts`의 `base`와 모델 경로(`CABINET_URL`)를 함께 바꿔야 합니다.
- 사용하지 않는 이전 모델은 `archive/`로 옮겨 배포물에 포함되지 않습니다.

## 기술 스택 (lockfile에 고정)

| 영역 | 패키지 |
|---|---|
| 앱 | Vite 8, React 19, TypeScript, React Router 7 |
| 3D | three 0.186, @react-three/fiber 9, @react-three/drei 10 |
| 모션 | gsap 3.15 + ScrollTrigger, @gsap/react |
| 상태 | zustand 5 (Focus·hover·stage 등 공유 UI 상태) |
| 폰트 | @fontsource/inter, @fontsource/playfair-display (셀프 호스팅) |

## 경험 흐름

| # | 장면 | 구현 |
|---|---|---|
| 01 | Intro | ① 브랜드 프리롤(자동): `PARK SU VIN → VIN → VISION INSIDE → VIN` (Skip은 프리롤만 건너뜀) ② 스크롤 구간: 잉크가 번진 문장 `Hi, I'm Suvin Park…` → 선명해짐 → 인디고 서랍장이 화면 아래에서 상승해 마지막 줄 앞에 겹침 |
| 02 | Home | 스크롤로 정면 → 상승 원근 → 상판 Top View (카메라 위치 + 주시점 동시 보간), 상판 위 VIN 명함 |
| 03 | Card Focus | 스크롤 시 명함 쪽으로 다가가는 프리뷰 / 클릭 시 명함 확대·뒤집기 오버레이 |
| 04 | About | 첫째 서랍 열림, 이력서 종이 |
| 05 | (스크롤) 이력서 | 이력서가 서랍 밖으로 올라와 커지고 HTML 이력서가 겹쳐 읽힘 → 다시 서랍으로 들어간 뒤 서랍이 닫힘 |
| 05 | Resume Focus | 스크롤 프리뷰 / 클릭 시 HTML 이력서(내부 스크롤) |
| 06 | Work | 첫째 닫힘 → 둘째 열림, PACKIT · PRINTCAFE · LE LABO 파일 순차 강조 |
| 07 | Project Focus | 파일 클릭 → 꺼내지는 모션 + 가로 캐러셀(시안 07) / 전체 파일 그리드(시안 08) → `/work/:slug` 상세 |
| 08 | Contact | 둘째 닫힘 → 셋째 열림 → 전화기 벨(수화기 진동 + `띠링, 띠링`) → 수화기를 클릭·탭하면 받침에서 분리되어 올라가고 `Connected to VIN.` 연락처 화면 → HANG UP/Escape로 내려놓음. 명함은 서랍 속에 그대로 남아 클릭 가능 |

상단 메뉴 `HOME · ABOUT · WORK · CONTACT`는 해당 스크롤 지점으로 이동하며, 열린 Focus를 먼저 닫습니다. Contact 패널에 `Back to top`, `Replay intro`가 있습니다.

## 구조

```text
src/
├─ app/App.tsx                 메인 경험(단일 Canvas + 타임라인), WebGL fallback, 라우트
├─ animations/
│  ├─ stages.ts                타임라인 구간·카메라 프리셋·서랍 상수 (튜닝은 여기서)
│  ├─ rig.ts                   GSAP가 쓰고 렌더 루프가 읽는 값(React 상태 아님)
│  ├─ masterTimeline.ts        ScrollTrigger + 단일 마스터 타임라인, 메뉴 이동
│  └─ gsap.ts                  플러그인 1회 등록
├─ components/
│  ├─ three/                   Cabinet(cabinet_v3.glb + 서랍 안쪽 상자), CameraRig, BusinessCardObject,
│  │                           ResumePaper, ProjectFiles, TelephoneObject, SceneLabels …
│  ├─ navigation/HeaderNav.tsx
│  └─ overlays/                Dialog(접근성 셸), BusinessCardDetail, ResumeDetail, ProjectFocus
├─ scenes/Intro/IntroTypography.tsx
├─ scenes/Panels/SectionPanels.tsx   구간 텍스트 + 3D와 같은 기능의 HTML 버튼
├─ pages/ProjectDetail.tsx           /work/:slug
├─ data/profile.ts, projects.ts      콘텐츠의 유일한 출처 (비어 있으면 TODO 표시)
├─ state/experienceStore.ts
└─ styles/tokens.css, global.css
public/models/cabinet_v3.glb         사용자 제공 모델 v3 (body / drawer1~3 독립 노드, meshopt 압축)
archive/cabinet_v2.glb                    (미사용) 이전 GLB — 배포물에서 제외
```

## 주요 기술 결정

- **Intro 스크롤 구간.** 마스터 타임라인 앞쪽 `INTRO_SPAN`(14단위 ≈ 154vh)에 들어 있으며, 기존 구간은 그만큼 뒤로 밀렸습니다(`stages.ts`).
  - 구간 내부 비율: 0–15% 번진 상태 유지 → 15–40% 잉크 선명화 → 40–75% 서랍장 상승 → 75–100% 유지. 그다음 기존 정면 → Top View 카메라 전환이 이어집니다.
  - 잉크 번짐은 SVG 필터(`feTurbulence` + `feDisplacementMap` + `feGaussianBlur` + 알파 대비 + 농도 노이즈)이고, 타임라인이 값을 줄입니다(`inkBleed.ts`). 완전히 선명해지면 필터를 끕니다.
  - 서랍장 상승은 루트 그룹의 y 이동(`rig.rise`)만 사용하며, 서랍 개폐 Transform과는 분리되어 있습니다.
  - 카메라는 Intro 동안 정면에 고정됩니다. 하나의 ScrollTrigger만 카메라와 서랍장을 제어합니다.
  - Reduced motion에서는 번짐 없이 선명하게 시작하고, 상승은 순간 전환됩니다.
- **애니메이션 소유권 분리.** 스크롤 타임라인은 `rig`(카메라·서랍·기본 오브제 값)와 섹션 패널만 다룹니다. Hover는 별도 자식 그룹(`Lift`)이, Focus는 DOM 오버레이가 담당합니다. 같은 Transform을 두 시스템이 동시에 쓰지 않습니다.
- **역스크롤.** `scrub` 타임라인이라 진행률이 항상 절대값입니다. 서랍 구간은 서로 겹치지 않아서(닫힘이 끝난 뒤 다음 서랍이 열림) 한 프레임에 두 서랍이 열릴 수 없습니다.
- **React 리렌더 없음.** 스크롤 중에는 `rig` 객체만 바뀌고 `useFrame`이 읽어 적용합니다. stage 상태는 구간이 바뀔 때만 갱신됩니다.
- **GLB 보정.** 모델에 정점 노멀이 없어 로더가 flat shading을 켭니다. 부드러운 노멀을 계산합니다. 서랍 노드는 앞판만 있으므로 내부 트레이를 코드로 덧붙였습니다.
- **서랍 매핑.** 위에서부터 01 About = `drawer3`, 02 Work = `drawer2`, 03 Contact = `drawer1`(맨 아래)입니다. 열림 방향은 모델 로컬 +Z입니다.
- **Focus 상태.** `none | card(home/contact) | resume | project` 중 하나만 열립니다.
  - 열려 있는 동안 배경 스크롤을 잠그고(위치 유지), Canvas는 필요할 때만 그립니다(`frameloop="demand"`).
  - 닫으면 열었던 버튼으로 포커스가 돌아갑니다.
- **상세 페이지.** 3D 위에 고정된 문서 레이어로 열리고, 그동안 렌더 루프는 멈춥니다. 메인 스크롤 위치가 그대로 보존됩니다. 직접 진입했을 때는 Back을 누르면 Work 구간과 해당 파일 선택 상태로 이동합니다.
- **라벨.** drei `Html`은 StrictMode에서 React 루트 경고가 있어 쓰지 않습니다. 렌더 루프가 DOM 라벨의 화면 좌표를 직접 갱신합니다.
- **지연 로드.** three.js(약 289 kB gzip)와 상세 페이지는 별도 청크입니다. 인트로 타이포는 3D 로딩 전에 그려집니다.
- **반응형.** 화면 비율에 따라 카메라 거리를 자동 보정해 서랍장 폭이 잘리지 않습니다. 세로 화면에서는 텍스트 패널이 하단 카드로 바뀌고, Intro 문장이 서랍장 위로 올라갑니다.
- **접근성.**
  - 3D 오브제마다 같은 기능의 HTML 버튼이 있습니다.
  - 오버레이는 `role=dialog`이고 초기 포커스·Tab 순환·Escape·포커스 복귀를 지원합니다.
  - `prefers-reduced-motion`이면 인트로 생략, 카메라·서랍 순간 전환, 전화기 진동 제거, 패럴랙스 없음으로 동작합니다.
  - WebGL이 없거나 3D 오류가 나면 문서형 화면으로 전환합니다.

## 문서 간 충돌과 결정

| 항목 | 내용 | 적용 |
|---|---|---|
| 3번째 서랍 | Master v1은 Skills, GUIDE·노션·Master v2는 Contact 전화기 | **Contact 전화기**. Skills는 이력서 HTML의 보조 섹션 |
| 프로젝트 수 | Master v1은 Tunee 포함 4개 이상, GUIDE·v2는 3개 | **3개** (PACKIT·PRINTCAFE·LE LABO) |
| Intro 문구 | GUIDE: `PARK SU VIN → VISION INSIDE → VIN` / 와이어프레임: `Hi, I'm Suvin Park…` 문장 | 키네틱 타이포 후 시안 문장을 서랍장 뒤에 표시 |
| 와이어프레임 메뉴 | 시안 07·10에 `PROJECTS`·`SKILLS` 표기 | Master v2대로 `HOME · ABOUT · WORK · CONTACT` |
| 서랍장 외형 | 시안 03~10은 우드 측면·텍스처 상판 / 제공 GLB는 크롬 프레임 | 단일 모델 원칙에 따라 **제공 GLB** 사용 |
| 배경 | GUIDE `#FFFFFF`, Top View 시안은 밝은 회색 바닥 | Intro는 흰색, 스크롤하며 `#ECECE9`로 전환 |
| 텍스트 보조색 | `#737782` 제안값은 회색 배경 대비가 낮음 | `#5C606B` 사용 |
| Contact 헤드라인 | 시안에 문구 없음 | `Let’s connect.`(UI 문구, 사실 정보 아님) |

노션 페이지는 직접 열람하지 않았습니다. 대화로 받은 와이어프레임 이미지와 GUIDE를 기준으로 구현했습니다.

## 검증 결과 (2026-10-27)

Chrome headless(puppeteer-core)로 화면을 캡처해 확인했습니다. 성능은 GPU 모드(RTX 4060, D3D11)에서 측정했습니다.

| 항목 | 결과 |
|---|---|
| `npm run build` / `tsc -b` | 통과 (lint: 경고 5, 오류 0) |
| 콘솔 오류 | 없음. three 내부 deprecation 경고(`THREE.Clock`)와 D3D 셰이더 컴파일러 경고만 출력 |
| 렌더 성능 | GPU 모드 약 60fps. 소프트웨어 렌더링(SwiftShader)에서는 1~3fps |
| Intro | 키네틱 → 정면 서랍장 + 문장. 데스크톱·모바일 캡처 확인. Skip·스크롤 시 건너뜀 |
| 정방향 스크롤 | Intro → Top View → About → Work → Contact 구도 캡처 확인 |
| 역스크롤 | Contact → About 복귀 시 첫째 서랍만 열린 상태 확인 |
| 상단 메뉴 | WORK·CONTACT 이동과 현재 위치 표시 확인 |
| 명함 | 3D 클릭·버튼으로 열기, 뒤집기, Escape 닫기, 포커스 복귀 확인 |
| 이력서 | 버튼으로 열기·Escape 닫기 확인 |
| 프로젝트 | 3D 파일 클릭·버튼, 캐러셀 이전/다음, 전체 파일 그리드, 상세 진입, Back(선택 상태 유지) 확인. `/work/le-labo` 직접 진입 → Back → Work + LE LABO 선택 확인 |
| Contact | 3D 전화기 클릭 → 명함 등장 후 뒷면 전환, 닫기 확인 |
| 모바일 390×844 | Intro·Home·Work·Project Focus·Contact 캡처 확인 |
| Reduced motion | 인트로 생략, 구간 순간 전환 확인 |
| WebGL 미지원 | `--disable-webgl`에서 문서형 fallback 확인 |

**확인하지 못한 항목**
- 실제 휴대폰(iOS·Android) 터치, Safari·Firefox
- 트랙패드 관성 스크롤 체감
- 중저사양 기기 성능
- 스크린리더 낭독
- Lighthouse
- 3D 오브제 hover 피드백은 코드로만 구현했고 캡처로 확인하지 않았습니다.

## 알려진 한계 / 후속 제안

- **GLB 품질.** AI 생성 메시 특성으로 크롬 프레임 표면이 구겨져 보입니다. 리토폴로지나 노멀 베이크가 들어간 모델로 교체하는 것을 권장합니다. 모델은 약 5.6 MB이며 Draco·Meshopt 압축 여지가 있습니다.
- **임시 오브제.** 전화기·파일 폴더·이력서 종이는 코드로 만든 기능 검증용입니다. 최종 비주얼이 아닙니다.
- **저사양 대응.** 인트로는 GSAP lag smoothing 때문에 매우 느린 기기에서 길어집니다. Skip이나 스크롤로 건너뛸 수 있습니다.
- **스크롤 타이밍.** 구간 길이(`stages.ts`, `masterTimeline.ts`)는 실제 기기 체감 후 조정이 필요합니다.
- **오디오.** 전화기 효과음은 넣지 않았습니다(기본 무음 원칙).
