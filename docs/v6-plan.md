# V6 — 듀오톤 책상 (브랜치 `v6-desk`)

기준 자료: `docs/refs/home/` — `home-spec.md`(명세), `home-target.png`(목표 화면), `prototype/home-prototype.html`(시험판, **값이 다르면 시험판이 맞다**).
코드: `src/v6/`, 진입점 `src/main.tsx` → `V6App`. v2~v5 코드는 그대로 남아 있지만 이 브랜치에서는 쓰지 않는다.

## 실행

```bash
npm install
npm run dev     # http://localhost:5173/#home
```

- `?tune` : 질감·외곽선 슬라이더와 팔레트 버튼(시험판 조정 화면)
- `?nowebgl` : WebGL 대체 화면(정적 이미지 `public/images/home/desk-static.webp` + 같은 메뉴)
- 키·비밀값은 `.env.local`에만. `.env.example`에는 변수 이름만.

## 구조

| 파일 | 역할 |
| --- | --- |
| `theme.ts` | 색 한 곳: 진한 색 `#1f4bd0` · 연한 색 `#e9e4d8`, ?tune 팔레트 후보, CSS 변수(--dark/--light) |
| `three/duotoneStyle.ts` | 듀오톤 후처리(밝기 5단계·외곽선 기준 0.62·정적 종이 질감 0.35). 사용자 제공 모듈을 옮김(팔레트 값은 theme.ts로) |
| `scene/HomeScene.ts` | 시험판 장면을 그대로: 카메라·물건 좌표·빛·블라인드 그림자·호버·스탠드·컵 |
| `scene/cabinet.ts` | **임시 서랍 캐비닛(코드 상자)**. `Cabinet` 인터페이스(group·drawers·setOpen·update)만 지키면 모델로 교체 가능 |
| `V6App.tsx` · `v6.css` | 머리글·호버 라벨(커서 따라감)·안내·?tune·로딩·대체 화면, 키보드용 사물 버튼(Tab 포커스 때만 보임) |

모델: `public/models/home/{table,imac,stand,phone}.glb`(줄인 것, 합계 1.76MB). 원본(stand 39MB 등)·obj/fbx는 저장소에 올리지 않는다.

## 확인(2026-11-05, Chrome)

| 항목 | 결과 |
| --- | --- |
| 목표 화면(1280×800) 대비 | 평균 밝기 차이 4.0/255 — 시험판 자체와 목표의 차이(4.0)와 같음(글꼴·렌더링 환경 차이). 시험판과 우리 결과: 1280 0.10 · 1440 0.08 |
| 모바일 390×844 | 시험판과 같은 세로 카메라(z 250, FOV 66). 시험판 HTML은 viewport 메타가 없어 휴대폰에서 데스크톱 폭으로 그려진다(UI만 다름) |
| 호버 라벨 | 스탠드·모니터·전화기·명함·서랍·컵 6개 |
| 스탠드 | 클릭·키보드로 켜고 끄기(원뿔·스포트 lerp .15) |
| 마우스 둘러보기 | 위치 ±(8,4) · 바라보는 곳 ±(22,9) · lerp .05 |
| 콘솔 | 오류·경고 0 |

스크린샷: `docs/v6-shots/` (compare-* = 왼쪽 목표, 오른쪽 결과)

## 다음(2단계)

- 사물 클릭·메뉴 → 다가가기(#screen #contact #about #work, lerp .06, Back to desk·Esc·뒤로가기)
- 모니터 화면 HTML(검은 평면 네 모서리 투영), 서랍 → work-drawer-prototype 폴더 탭·종이 카드, 전화기 → 메시지 폼

## 진행 기록

| 날짜 | 내용 |
| --- | --- |
| 2026-11-05 | 1단계: 시험판 Home 장면을 React/Vite로(HomeScene), 듀오톤·theme 한 곳·임시 캐비닛 분리, 마우스 둘러보기·스탠드·호버 라벨, 대체 화면 |
