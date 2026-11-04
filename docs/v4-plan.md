# V4 — HOME 3D 인터랙티브 작업실

브랜치 `v4` (v3에서 분기, 2026-11-04). 코드는 `src/v4/`, 진입점 `src/main.tsx` → `V4App`.
기준 이미지
- HOME 최종 구도·배치: `docs/v4-refs/home-final.png` (2026-11-04 확정. 이전 기준 intro-last-frame.png와 같은 방의 고해상도 시안)
- (이전) HOME 공간: `docs/v3-refs/intro-last-frame.png` (왼쪽 창 · 노란 스탠드 · 베이지 CRT · 금속 책상 · 버건디 의자 · 올리브 그레이 서랍장 · 빨간 전화기 · 오른쪽 선반)
- ABOUT 최종 구도·배치·색: `docs/v4-refs/about-final.png` (같은 방에 카메라가 다가간 장면)
- 재질·조명·입체감: `docs/v3-refs/ref-home-mood.png` (가구·디자인은 따르지 않는다)
인물·인트로 영상은 이번 범위에서 제외.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
```

- 하단 가운데 개발용 표시: 현재 상태(HOME_IDLE …)·호버·스탠드 상태. 빌드에서는 빠진다.
- 휴대폰 확인: 브라우저 개발자 도구 기기 모드(터치) 또는 같은 와이파이에서 `npm run dev -- --host`.

### 다른 컴퓨터에서 이어서 하기

```bash
git clone https://github.com/socutesubin-debug/Vin_portfolio.git   # 처음 한 번
git fetch origin && git switch v4                                   # 이미 받아 둔 경우
npm install
npm run dev
```

- `.env.local`(EmailJS 키)은 GitHub에 없다. 메시지 전송을 시험할 때만 `.env.example`을 복사해 직접 채운다.
- V3 INTRO 영상 프레임(`public/media/intro/`)은 용량 때문에 GitHub에 없다. V4·V5 작업에는 필요 없다.
- 다음 작업: `docs/v5_plan.md`(v5 기획). `v4`에서 `v5` 브랜치를 만들어 시작한다.

## 구조

| 파일 | 역할 |
| --- | --- |
| `config/home.ts` | 모든 숫자: 대표 구도·포인터 범위·감쇠, ABOUT 접근 구도, 전환 시간, 배치, 조명 프리셋, 스탠드·CRT·식물·먼지 |
| `config/hotspots.ts` | 누를 수 있는 오브제 목록(안내 문구·버튼 이름·안내 위치) |
| `state/homeStore.ts` | 상태 머신(zustand) |
| `scene/HomeCanvas.tsx` | 장면 구성. V2 오브제 재사용 + V4 오브제 |
| `scene/HomeCameraRig.tsx` | 포인터 카메라 + 접근·복귀 전환 |
| `scene/Hotspot.tsx` | 3D 오브제 호버·클릭(탭) → 상태 스토어 |
| `scene/AnchorProjector.tsx` + `ui/HotspotButtons.tsx` | 오브제 위치에 붙는 HTML 버튼(키보드·스크린리더, 호버 안내) |
| `scene/objects/` | Laptop(화면 발광·커서, HOME에서 씀) · CrtMonitor(지금은 안 씀), FileCabinet(서랍장·첫 서랍 열림·칸막이 파일), vinScreen(화면 그림), LampWithLight(전구·스포트라이트·그림자), WindowPlant(잎 흔들림), DustMotes(햇빛 먼지), Shelf, WallPosters |
| `scene/models/` | 절차 모델: LaptopModel, CrtModel, KeyboardModel(+MouseModel), DeskModel, MugModel, LampModel, ChairModel, DeskProps(플립 시계·펜꽂이·다이얼 전화기·노트·책), 공용 재질 materials.ts, 모양 함수 geometry.ts |
| `scene/objects/RoomExtras.tsx` | 러그, 왼쪽 앞 전경 선반 |
| `ui/HomeChrome.tsx` | 고정 UI: 로고·메뉴·사운드(기본 꺼짐)·©2026 |
| `ui/AboutPanel.tsx` + `scene/screenOverlay.ts` | ABOUT: 노트북 화면 안 이력서(HTML, `data/profile.ts`의 확인된 문구만). 위치·크기는 Laptop이 화면 네 모서리에 맞춘다 |
| `ui/WorkList.tsx` | WORK 프로젝트 목록(뒤 장면 흐림, 분류 필터, 두 줄 카드) |
| `ui/SceneNav.tsx` | 스크롤·스와이프로 장면 넘기기, 서랍에서 Escape, body[data-scene] 표시 |

V2 쪽 변경(동작은 그대로, 선택 인자만 추가): `Lighting` `preset`, `Room` `floorColor`.
개발용 고정 시점: `?view=about | work | files | laptop | phone` (확인용, `config/home.ts` DEV_VIEWS).

## 상태

```
HOME_IDLE ⇄ OBJECT_HOVER ─(CRT 클릭/탭/Enter, 메뉴 ABOUT)→ CAMERA_TRANSITION ─(도착)→ ABOUT_OPEN
ABOUT_OPEN ─(Close/Escape, 이력서 맨 위에서 위로 스크롤, 메뉴 HOME)→ RETURN_HOME ─(도착)→ HOME_IDLE
ABOUT_OPEN ─(이력서 끝에서 더 아래로 스크롤, WORK →, 메뉴 WORK)→ WORK_TRANSITION
HOME_IDLE ─(아래로 스크롤, 메뉴 WORK)→ WORK_TRANSITION ─(서랍장 앞 도착)→ WORK_OPENING ─(서랍 열림·내려다봄)→ WORK_FILES
WORK_FILES ─(파일 클릭, 아래로 스크롤)→ WORK_LIST ─(Escape, ← Drawer)→ WORK_FILES
WORK_FILES·WORK_LIST ─(위로 스크롤·Escape(서랍), 메뉴 HOME)→ RETURN_HOME
```

- 전환 중에는 호버·클릭·스탠드 조작을 받지 않는다(중복 클릭·카메라 충돌 방지). 포인터 카메라도 멈춘다.
- ABOUT 패널과 배경 막이 포인터를 받아 뒤쪽 3D로 전달되지 않는다.
- 후속 인터랙션: `HotspotId`에 id 추가 → `HOTSPOTS`에 안내 → `activate`에 동작 → 3D 오브제를 `<Hotspot id>`로 감싼다.

## 검증(2026-11-04, Chrome 실제 브라우저 자동 조작)

| 항목 | 결과 |
| --- | --- |
| 포인터 시차 | 왼쪽 위↔오른쪽 아래: 의자(앞) 약 110px, 뒷벽 포스터 약 20px 이동. 가장자리 빈틈 없음 |
| 고정 UI | 로고·메뉴·사운드·© 제자리 |
| CRT | 호버 → 밝아짐 + "About me" → 클릭 → 접근 → ABOUT → Close/Escape/배경 → 복귀. 전환 중 두 번째 클릭 무시 |
| 스탠드 | 켜면 책상 왼쪽 따뜻한 빛·그림자, 끄면 사라짐. 창 햇빛 무늬·전체 밝기 그대로 |
| 키보드 | Tab → 오브제 버튼(안내 표시) → Enter → ABOUT, 닫기에 포커스 → Escape 후 원래 버튼으로 포커스 복귀 |
| 모바일 390×844(터치) | 마우스 카메라 꺼짐, 탭으로 CRT 접근·스탠드 토글, 패널은 아래에서 올라옴 |
| 움직임 줄이기 | 포인터를 움직여도 화면 동일(카메라·잎·먼지 정지), 접근·복귀는 바로 전환 |
| 콘솔 | 오류 없음. 경고 1건: `THREE.Clock` 사용 중단(@react-three/fiber 내부) |
| 빌드 | `npm run build` 통과 |

## ABOUT 근접 품질(2차, 2026-11-04)

ABOUT은 HOME과 같은 3D 방에서 카메라만 모니터 앞으로 다가간다(평면 배경 전환 없음). 구도는 about-final.png에 맞춰 망원(30도)으로 본다.

| 사물 | 형태 | 재질 |
| --- | --- | --- |
| CRT | 뒤로 좁아지는 하우징, 둥근 앞판(베벨), 안으로 비스듬히 들어간 베젤, 볼록한 유리, 회전 받침, 본체 드라이브 베이·스티커·전원 | 미세 요철 베이지 플라스틱 / 유리: 거친 반사(점으로 맺히지 않게) + 은은한 발광·주사선·비네트 |
| 키보드 | 쐐기 몸체(둥근 모서리), 104키 개별 키캡(위가 좁은 기둥, 높이·간격), 표시등, 케이블 | 고운 요철 플라스틱, 글자키 밝게·기능키 짙게 |
| 책상 | 상판 두께 32mm·둥근 모서리, 테두리, 가운데 얕은 서랍(손잡이), 각관 다리·발 | 브러시드 스틸(한 방향 결·이방성) + 윗면 흐린 반사(거울 X) |
| 머그 | 두께 있는 회전체(굽·둥근 입술·안쪽 벽), 손잡이, 남은 커피, VIN 인쇄 | 유약 도자기(클리어코트) |
| 스탠드 | 돔 갓(통풍구·안쪽 반사면), 크롬 관절 | 도장 금속(부드러운 클리어코트) |

빛: 창 햇빛(PCSS 부드러운 창틀 그림자) + 낮춘 하늘·환경광 + 책상·바닥 접촉 그림자 + 화면 공간 차폐(N8AO, 틈·물체 아래 간접광 느낌) + ACES 톤 매핑. 휴대폰은 상판 반사를 끄고 차폐를 절반 해상도로.

확인(실제 Chrome):
- 원본과 가까운 정면 구도: 스탠드–시계–머그–CRT–펜꽂이–전화기–달력 배치가 about-final.png와 일치.
- 카메라를 조금 옮긴 구도(ABOUT에서 포인터 좌우 끝): 키보드 약 55px · 모니터 32px · 머그 25px · 벽 8~10px — 깊이에 따른 시차. 메뉴·로고 고정.
- 근접(?view=crt·desk·mug·keyboard): CRT 몸통 깊이·베젤 안쪽 면, 키캡 입체, 상판 결과 흐린 반사, 머그 유약 하이라이트·접촉 그림자 확인.

한계(솔직히): 모두 코드로 만든 절차 모델·절차 결이다. 사진 수준의 완성본이 아니다.
- 키캡 글자(각인) 없음, 키 윗면 오목함 없음.
- 플라스틱·종이·벽 결은 캔버스 잡음 — 스캔·베이크 텍스처(노멀·AO 맵)가 들어가야 기준 이미지 수준의 질감이 난다.
- 상판 반사는 반사면 렌더(MeshReflectorMaterial)라 성능을 쓴다. 휴대폰에서는 끈다.
- PCSS 셰이더가 Windows(ANGLE)에서 컴파일 경고(X4000)를 콘솔에 남긴다. 오류는 아니다.
- ABOUT 패널(오른쪽)이 펜꽂이·전화기·달력을 가린다 — 패널 위치·형태 결정 필요.

## HOME 구도(home-final.png, 3차)

- 구도(사용자 확정, 2026-11-04): HOME은 모니터 정면 망원(30도) 구도 — 기존 ABOUT 구도를 그대로 HOME으로 올렸다. `HOME_SHOT` = position [-0.1, 1.12, 1.0], target [-0.1, 1.03, -0.6]. 포인터 범위는 망원에 맞게 줄임(카메라 0.12/0.05, 주시점 0.025/0.012).
- ABOUT은 그 자리에서 모니터로 더 다가가고(z 0.72), 오른쪽 패널을 피해 모니터를 화면 왼쪽에 둔다. `ABOUT_SHOT`
- 방 전체(home-final.png)용으로 만든 의자·선반·러그·전경 선반은 HOME 화면에서는 거의 안 보이지만 모바일 세로 화면과 시차에서 쓰인다.
- 새 모델: 버건디 가로 주름 가죽 + 크롬 옆 프레임·팔걸이·5발 받침 의자, 흰 카드 플립 시계(지금 시각), 크롬 펜꽂이(연필 4·가위), 빨간 다이얼 전화기(꼬인 선), 펼친 노트·닫힌 책, 앵글 기둥 선반(바인더·켜진 버섯 조명·필름 카메라·수납 상자·덩굴 식물), 러그, 왼쪽 앞 전경 선반, 갈색 원목 바닥.
- 스탠드는 기준처럼 모니터 쪽으로 기울였다(ABOUT에서도 왼쪽 위에서 모니터를 비춘다).
- 확인: 대표 구도, 포인터 모서리(의자 약 100px·전경 선반 더 크게·벽 조금 — 가장자리 빈틈 없음), 스탠드 클릭, CRT 접근·복귀, 모바일 세로, 빌드.
- 기준과 남은 차이: 서랍장은 V2(크롬 테두리)라 기준의 매끈한 올리브 철제와 다름, 창밖은 그린 그림(벽돌·나무), 화분·덩굴 잎은 타원체, 바인더 라벨·책 표지 글자 없음, 로고·메뉴 글자색(기준은 흰색, 지금은 가독성을 위해 짙은 색).

## 책상 배치·HOME 구도·WORK(4차, 2026-11-04)

기준: 배치 `docs/v4-refs/home-layout.png`, HOME 구도 `docs/v4-refs/home-composition.png`. WORK 기준 다섯 장(서랍장 정면 / 칸막이 파일 상자 / 열린 서류함 / 칸막이 탭 파일 / 프로젝트 목록)은 대화로 받은 이미지라 파일로 남기지 못했다 — 필요하면 `docs/v4-refs/work-*.png`로 넣어 둘 것.

**HOME**
- 책상을 뒷벽에 붙였다. 뒤쪽 한 줄에 스탠드 · 플립 시계 · 노트북 · 빨간 전화기, 앞쪽 왼쪽에 펼친 노트와 작은 책. 벽 왼쪽 위 포스터 묶음, 오른쪽 달력.
- 모니터(CRT) → 노트북(`LaptopModel`, 절차 모델). 화면 그림은 CRT와 같고(`vinScreen.ts`) 주사선만 뺐다. 핫스팟 id는 `'crt'` 그대로(ABOUT으로 가는 화면).
- 빠진 것: 의자, 키보드·마우스, 머그, 펜꽂이, 오른쪽 책, 왼쪽 앞 전경 선반(모델 파일은 남겨 둠).
- 구도: 책상 높이 조금 위(1.04m)에서 뒷벽을 정면으로, 화각 30도. 아래 약 1/3이 책상 윗면, 위가 벽. `HOME_SHOT`
- ABOUT은 노트북으로 다가가고, 노트북은 화면 왼쪽·패널은 오른쪽. `ABOUT_SHOT`

**WORK** (`HomeMode`: WORK_TRANSITION → WORK_OPENING → WORK_FILES → WORK_LIST)
1. HOME에서 아래로 스크롤하거나 메뉴 WORK → 카메라가 같은 거리에서 그대로 아래로 내려가 책상 밑 올리브 서랍장 정면(`WORK_SHOT`).
2. 정면을 0.45초 보여 준 뒤 첫 서랍이 열리고, 카메라가 앞 위에서 서랍 안을 내려다본다(`FILES_SHOT`). 서랍 안: 분류 칸막이(큰 탭) → 프로젝트 카드(엇갈린 탭에 이름·연도, 분류 색 띠) → 사이사이 얇은 자료 묶음.
3. 파일을 누르거나 한 번 더 아래로 스크롤 → 뒤 장면이 흐려지고 프로젝트 목록(HTML): 제목 Projects · 분류 필터(개수) · 두 줄 카드(대표 이미지 + 이름 + 화살표). 로고·메뉴는 흰색.
4. 돌아가기: 목록에서 Escape·"← Drawer" → 서랍 속 파일, 서랍에서 Escape·위로 스크롤 → HOME, 메뉴 HOME은 어디서든 HOME(서랍이 닫히며 올라간다).
- 서랍장(`FileCabinet`, 절차 모델): 위 두 칸 얕고 아래 한 칸 깊음, 크롬 막대 손잡이, 위 틀·가운데 서랍 열쇠 구멍. 수치는 `CABINET`.
- 프로젝트 내용·분류는 `src/v2/data/projects.ts`를 그대로 쓴다(지금 7개, 모두 임시). 분류는 UX/UI · 브랜딩·그래픽 · 패션 — 기준 이미지의 Web 분류는 데이터에 없다.
- 휠은 트랙패드 관성으로 두 장면을 건너뛰지 않게 장면이 바뀐 뒤 0.7초 동안 무시. 터치는 위로 쓸어 올리기 = 아래로 스크롤.
- 확인: HOME → WORK 메뉴 → WORK_OPENING → WORK_FILES → 파일 버튼 → WORK_LIST → Escape → WORK_FILES → Escape → HOME_IDLE, 노트북 클릭 → ABOUT → Escape → HOME, 모바일 세로(HOME·서랍·목록 한 줄), 빌드.

## ABOUT = 노트북 화면 속 이력서(5차, 2026-11-04)

- 노트북을 누르면 카메라가 화면을 정면(화면 법선 방향, 0.6m)에서 마주 보고(`ABOUT_SHOT`), 화면 영역에 이력서 HTML이 켜진다. 옆 패널은 없앴다.
- 이력서 HTML은 실제 DOM(스크롤·선택·스크린리더 가능). Laptop이 매 프레임 화면 네 모서리를 화면 좌표로 옮겨 크기·위치를 맞추고, 글자는 화면 폭(cqw)에 비례한다. 색은 VIN 화면과 같은 남색·주황.
- 내용: 이름·메시지·Brand·Concept·Role·Email, Profile·Education·Experience·Skills·Philosophy(`data/profile.ts`, 비어 있으면 준비 중).
- 흐름 HOME → ABOUT → WORK: 이력서를 끝까지 내린 뒤 더 스크롤하거나 "WORK →" → 카메라가 서랍장으로 내려가 첫 서랍이 열린다. 이력서 맨 위에서 위로 스크롤·Close·Escape → HOME.
- 모바일 세로: 같은 정면에서 화면 폭에 맞게 물러난다. 화면이 작아(약 310×190px) 이력서는 그 안에서 스크롤된다.
- 확인: 노트북 클릭 → ABOUT_OPEN(화면에 이력서), 포인터 이동 시 화면을 따라감, 끝에서 휠 → WORK_TRANSITION → WORK_FILES, 모바일 세로, 빌드.

## 임시 에셋(최종 에셋 필요)

모두 기본 도형·캔버스 그림이다. 사진 수준이 아니다.

- **근접 모델(V4 절차 모델)**: CRT·키보드·마우스·책상·머그·스탠드 — 형태는 갖췄지만 최종 GLB·베이크 텍스처로 교체 대상. CRT는 유리(`GLASS`), 스탠드는 갓 안 전구 자리(children)만 맞추면 된다.
- **노트북·서랍장·서랍 속 카드**: V4 절차 모델(기본 도형 + 캔버스 그림). 노트북은 최종 모델이 오면 `LaptopModel`의 화면 자리(children)만 맞추면 된다. 전화기는 V4 모델로 바뀌어 CONTACT(수화기 들기) 동작은 다시 연결해야 한다.
- **식물**: 잎이 타원체 → 잎 메시(흔들릴 잎만 그룹 분리).
- **선반**: 책·상자·카메라·버섯 조명이 상자 도형 → 모델 또는 책 표지·라벨 텍스처.
- **텍스처**: 포스터·카드·CRT 화면은 캔버스로 그린 자리표시 → 최종 이미지. 창밖 풍경·바닥 나뭇결도 절차 텍스처.
- **조명**: 전부 실시간(베이크 없음). 라이트맵을 구울 때는 스탠드 빛을 빼고 굽고, 스탠드는 실시간 스포트라이트로 유지.

## 남은 일

- 전화기(CONTACT)를 Hotspot으로 연결, 메뉴 CONTACT 활성화.
- WORK: 프로젝트 카드 → 상세 화면, 실제 프로젝트·대표 이미지(`src/v2/data/projects.ts`), 분류 이름 확정(기준 이미지는 Web 포함).
- ABOUT 패널 내용: `data/profile.ts`의 직무·자기소개·스킬 채우기.
- 사운드: 버튼은 있음(기본 꺼짐), 재생할 소리 없음.
- 색감: 기준 이미지보다 밝고 평평하다 → 최종 재질·텍스처 단계에서 대비·따뜻함 조정(`HOME_LIGHTING`).
- 최종 에셋 교체 후 포인터 범위(`POINTER_CAMERA`)를 다시 확인(모델 뒷면 노출 여부).

## 진행 기록

| 날짜 | 내용 |
| --- | --- |
| 2026-11-04 | ABOUT을 노트북 화면 속 이력서로(화면 정면 카메라 + 화면에 맞춘 HTML), ABOUT 끝에서 스크롤 → WORK 서랍 |
| 2026-11-04 | 책상 배치를 home-layout으로(벽에 붙인 책상, 스탠드·시계·노트북·전화기·노트·책, 의자 삭제), HOME 구도 home-composition, 모니터 → 노트북. WORK: 서랍장으로 내려가기 → 첫 서랍 열림·칸막이 파일 → 프로젝트 목록 |
| 2026-11-04 | HOME 구도를 모니터 정면 망원(사용자 확정)으로 변경, ABOUT은 더 가까이·모니터 왼쪽·패널 오른쪽 |
| 2026-11-04 | HOME을 home-final.png 구도로: 낮은 넓은 화각 카메라, 의자·시계·펜꽂이·전화기·노트·책·선반·러그·전경 선반·원목 바닥 절차 모델, 스탠드 방향 |
| 2026-11-04 | ABOUT 근접 품질: CRT·키보드·책상·머그·스탠드 절차 모델, 사물별 재질, PCSS·접촉 그림자·N8AO, ABOUT 구도(about-final.png)·ABOUT 포인터 시차, 개발용 근접 시점. 의존성 `@react-three/postprocessing` 추가 |
| 2026-11-04 | v4 브랜치 생성. HOME 시제품: 포인터 시차 카메라, CRT 접근·ABOUT·복귀, 스탠드 켜기/끄기, 식물 흔들림·햇빛 먼지, 선반·포스터, 고정 HTML UI, 키보드·터치·움직임 줄이기 대응 |
