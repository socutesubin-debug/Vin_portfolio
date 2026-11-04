# V5 — Home 책상 · Work 수납장 · Projects · Contact 전화기

브랜치 `v5` (v4에서 분기, 2026-11-05). 코드는 `src/v5/`, 진입점 `src/main.tsx` → `V5App`.
기획: `docs/v5_plan.md`(노션 V5 페이지와 같은 내용), 레퍼런스 `sources/reference-1~8.png`(읽기 전용).

## 실행

```bash
npm install
npm run dev            # http://localhost:5173
```

- 해시로 각 화면 바로 열기: `#home` `#about`(자기소개서) `#resume`(이력서) `#work` `#projects` `#project-<id>` `#contact` `#message`
- 확인용: `?nowebgl`(3D 폴백 화면 강제), `?dev=drawers`(개발 서버 전용 — cabinet_v3.glb 서랍 이름표)
- 메시지 전송을 시험할 때만 `.env.example`을 `.env.local`로 복사해 EmailJS 키를 채운다(커밋 금지). 키가 없으면 양식은 "전송 서비스 미연결"로 표시하고 보내지 않는다.

## 구조

| 파일 | 역할 |
| --- | --- |
| `V5App.tsx` | 화면 전환(장면이 바뀔 때 페이드 0.15s+0.2s), 새 화면 제목으로 포커스, 화면 코드 지연 로드 |
| `router.ts` | 해시 ↔ 화면, 뒤로 가기 = hashchange |
| `focus.ts` | 도착 시 보이는 제목으로 포커스(지연 로드 대기), 패널을 연 버튼 기억·복귀 |
| `prefs.ts` | 모션 줄이기, 소리 설정(기본 꺼짐, sessionStorage로 페이지 이동 간 유지) |
| `ui/Nav.tsx` | HOME / ABOUT / WORK / CONTACT · 소리 버튼 |
| `ui/Panel.tsx` | 공통 대화상자: 닫기·Escape·바깥 클릭, Tab 가둠, 뒤쪽 inert, body로 포털 |
| `ui/HomeView.tsx` + `home/HomeScene.ts` | Home 자리표시(이력서·자기소개서 패널, 보기 전환 버튼 자리). 3D는 인터페이스와 구현 순서만 |
| `ui/WorkView.tsx` + `three/WorkScene.ts` | 수납장·서랍·파일 탭 |
| `ui/ProjectsView.tsx` + `data/projects.ts` + `data/listState.ts` | 목록·상세, 필터·스크롤 복원 |
| `ui/ContactView.tsx` + `three/ContactScene.ts` + `ui/MessageForm.tsx` + `contact/` | 전화기·전화 받기·양식·전송·벨소리 |
| `three/loaders.ts` | GLB 로더(MeshoptDecoder 포함 — cabinet_v3.glb는 meshopt 압축) |
| `ui/SceneStatus.tsx` | 로딩 표시, WebGL 없음·로드 실패 폴백(정적 그림 + 텍스트 버튼) |

3D 사물 위에는 같은 동작을 하는 실제 HTML 버튼이 붙어 있다(장면이 매 프레임 위치를 옮김). 그래서 클릭·터치·키보드 모두 같은 경로로 실행된다.

## 화면별 동작

**Work** — `cabinet_v3.glb`: drawer1 = 아래, **drawer2 = 가운데**, drawer3 = 위(`docs/v5-shots/1-drawers-desktop.png`). 서랍은 앞판만 있는 독립 노드라 drawer2를 그룹으로 옮기고 안쪽 트레이·파일을 코드로 덧붙여 함께 움직인다. 양옆 수납장 4개는 같은 모델의 배경 복제본.
- '프로젝트 서랍 열기' → 서랍 0.68m 앞으로(0.5s) + 카메라 0.3m 위로·살짝 내려다봄(0.45s) → 첫 파일 탭으로 포커스
- 파일 탭(분류 이름 + 실제 프로젝트 수) → 파일이 위로 빠져나옴(0.38s) → 해당 필터 목록
- Escape·'서랍 닫기' → 닫힘, '프로젝트 서랍 열기'로 포커스. '프로젝트 목록 바로 보기' 링크
- 수치는 `WorkScene.ts` 위쪽 `DRAWER` `CAMERA` `PICK`

**Projects** — 큰 카드 2열/1열, All·분류 필터와 건수(데이터에서 계산), 상세 7단(배경·기간·팀·역할 → 문제와 목표 → 조사와 관찰 → 디자인 판단 → 흐름과 주요 화면 → 피드백과 수정 → 결과와 배운 점). 상세에서 돌아오면(뒤로 가기·하단 '프로젝트 목록'·위 '← 프로젝트 목록') 필터·스크롤·열었던 카드 포커스 복원.

**Contact** — 벨(수화기·본체 흔들림, 소리 켰을 때 벨소리) → '전화 받기'(또는 전화기 클릭) → 벨 정지, 수화기가 들려 왼쪽으로(0.6s Timeline), 전화기가 화면 왼쪽(모바일은 위)으로 → `#message` 양식. '메시지 바로 남기기'는 연출 없이 바로 양식. 양식: 이름·소속 선택, 회신 이메일·메시지 필수(오류 문구·첫 오류로 포커스), 보내는 중 버튼 잠금, 미연결·실패 시 입력 유지.

**Home** — 자리표시. 이력서·자기소개서 패널과 메뉴 ABOUT, 바로가기 링크는 동작한다. 'Home 시안 / 3D 배치 / 평면도' 버튼은 자료가 올 때까지 비활성.

## Home을 이어서 만들 때 (output 폴더가 오면)

`src/v5/home/HomeScene.ts` 머리 주석에 순서가 있다. 요약:
1. `output/home-prototype/index.html`을 실행해 로더·카메라·보기 전환을 확인하고 옮긴다.
2. `imac.obj`·`table.obj`·`cabinet.glb`를 `public/v5/home/`에 복사(FileCabinet01.obj는 형상이 비어 있어 제외). OBJ는 재질 파일이 없어 임시 재질.
3. 'Home 시안': V6 배경 위에 카메라 화각·위치를 사진에 맞추고, 책상·수납장 모델은 숨긴 채 책상 윗면만 ShadowMaterial로 남겨 iMac·서류더미 접촉 그림자를 받는다. 빛은 왼쪽 블라인드 방향.
4. iMac 클릭 → 화면 앞으로(GSAP Timeline 0.7–0.9s) → `#resume`. 서류더미(임시 형태) → `#about`.
5. 'Home 시안 / 3D 배치 / 평면도' 버튼 활성화(`HomeView.tsx`의 `disabled` 제거).

## 검증 (2026-11-05, 실제 Chrome — puppeteer-core 자동 조작, 1440×900·390×844 터치)

스크린샷: `docs/v5-shots/` (1-* 뼈대·서랍 확인, 2-* Work·Projects, 3-* Contact)

| 항목 | 결과 |
| --- | --- |
| 서랍 확인 | drawer2 = 가운데(y 0.82–1.32), drawer1 아래, drawer3 위 |
| 이력서·자기소개서 | 버튼·메뉴 ABOUT·`#resume` 바로 열기 → 패널, 제목 포커스, Escape → 연 버튼으로 포커스, 뒤로 가기로 닫힘 |
| 서랍 → 파일 → 목록 → 상세 | 버튼·3D 앞판 직접 클릭·키보드(Enter·Tab·Escape) 모두 동작, 탭 → 해당 필터(UX/UI 3·Branding 2) |
| 목록 복원 | 뒤로 가기·하단 버튼: 필터·스크롤(700 → 700)·카드 포커스 복원 |
| 연락하기 → 전화 받기 → 양식 | 상세 하단 '연락하기' → `#contact` → 전화 받기 → 약 0.7s 뒤 양식, 제목 포커스 |
| 양식 | 빈 제출 → 두 필수 오류·이메일 칸 포커스, 잘못된 이메일 오류, 보내는 중 버튼 잠금, 결과 '전송 서비스 미연결'·입력 유지 |
| 바로가기 | Home '메시지 바로 남기기' → 양식, '프로젝트 목록 바로 보기' |
| 뒤로·앞으로 | 장면·주소·제목 일치, 패널이 열려 있으면 뒤쪽 메뉴는 inert |
| 모션 줄이기 | 서랍 즉시 열림(60ms 안), 전화기 흔들림 없음, 카메라 이동 생략 |
| 폴백 | `?nowebgl`: Work 정적 수납장 + 분류 버튼, Contact 정적 전화기 + 전화 받기 → 양식 |
| 소리 | 기본 꺼짐(벨 0회), 켜면 벨 울림, 받으면 멈춤, 새로고침 후 설정 유지(조작 전에는 재생 안 함) |
| 지연 로드 | 첫 청크 index 302kB(gzip 100kB)에 three.js 없음. three는 Work·Contact 진입 때만 |
| 콘솔 | 오류 0. 경고: Windows ANGLE 셰이더 X4122(무해, V4와 같음) |
| 빌드 | `npm run build` 통과 |

## 자리표시와 필요한 것

**콘텐츠(지어내지 않음 — 확인 후 채움)**
- 프로젝트 7개 모두 자리표시(`src/v2/data/projects.ts` 임시 항목). 대표 이미지·한 줄 소개·기간·팀·역할·도구·케이스 스터디 6칸은 `src/v5/data/projects.ts`의 `STUDIES`에 id별로 채운다.
- 파일 탭·필터 분류 UX/UI · Branding · Fashion — **분류명 확정 필요**(화면에 표시 중).
- 자기소개서 원고, 이력서(직무·학력·경력·스킬 — `src/data/profile.ts`).
- 공개 연락처(양식 'To' 줄)와 실제 메시지 수신 주소·EmailJS 키. 레퍼런스 8의 연락처는 쓰지 않았다.

**에셋**
- Home: `output/` 폴더 전체(V6 배경, 평면도 SVG, imac.obj, table.obj, cabinet.glb, 프로토타입 index.html), `AGENTS.md`.
- 서류더미·스탠드·커피·만년필 모델, 노트북(덮개 분리·힌지 피벗) 모델.
- **벽걸이 전화기**: 지금은 Three.js 기본 도형 임시 모델. 본체·수화기를 분리한 GLB(수화기 피벗 = 손잡이 가운데) 필요.
- 수납장: `cabinet_v3.glb`는 코발트 파랑 + 크롬이라 레퍼런스 3의 도장 철제(머스터드·올리브)와 색이 다르다. 서랍 안쪽은 코드로 만든 트레이. 레퍼런스 색의 모델이나 텍스처가 필요하면 교체.
- 효과음: 벨은 WebAudio 합성(파일 없음). 종이·스위치·컵·펜 소리는 아직 없음.

## 진행 기록

| 날짜 | 내용 |
| --- | --- |
| 2026-11-05 | Home 포인터 카메라·구도(V4처럼): 사진을 벽·책상 면에 투사(셰이더)해 실제 시차, 포인터 범위·감쇠는 V4 값(카메라 ±0.10/0.04m, 주시점 ±0.02/0.01m, 2.6/1.6), 마우스만·움직임 줄이기 고정. 구도는 사진 아래쪽 66% 확대(책상이 화면 아래쪽). 끝까지 옮기면 앞 사물 약 26px · 뒤 사물 약 20px · 블라인드 약 14px |
| 2026-11-05 | Home 1번 시안: 블라인드 배경(output/visuals/v5-home-desk-background-v6.png), 글자 요소 제거(메뉴·소리·©만, 사물 라벨은 마우스 올림·포커스 때만), 소품 6개 — iMac Pro(→이력서), 서류더미(종이 도형 →자기소개서), 전화기(→Contact), 스탠드(켜기/끄기·빛 번짐), 머그(사진 컷아웃·흔들림), 만년필(구르기). PEN1·스탠드·전화기는 meshoptimizer로 줄인 web/ 사본. 3D 배치는 ?view=layout |
| 2026-11-05 | Home 2단계: 그림자만 받는 책상 윗면(ShadowMaterial) + iMac(imac.obj, 임시 재질·화면 판) + 사진에 맞춘 카메라(화각 38°, 책상 깊이 0.95m → 높이 0.24m·벽에서 1.69m)·왼쪽 창 햇빛. iMac → 앞으로 0.8s → 이력서. 3D 배치 보기(table.obj). 확인용 ?dev=models |
| 2026-11-05 | Home 1단계: V6 배경(output/visuals/v5-home-desk-background-v6 → public/images/home/ PNG·WebP), coverRect 배치 |
| 2026-11-05 | 1단계 뼈대(라우터·메뉴·페이드·패널·Home 자리표시·서랍 확인), 2단계 Work·Projects, 3단계 Contact, 4단계 검증·기록 |
