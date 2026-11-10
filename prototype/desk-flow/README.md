# VIN 책상 흐름 (3D 프로토타입)

three.js 책상 장면 하나로 이어지는 포트폴리오 흐름.
Home → Work(모니터: 작업물 목록) → About(서랍: 이력서·자기소개서 등 서류) → Contact(전화) → Ending(퇴근)

- 실행: `index.html`을 정적 서버로 열기 (예: `npx serve prototype/desk-flow`)
- `models.js`: 3D 모델(스탠드·전화기·수화기·책상·의자) base64
- `models/*.glb`: 새 모델(웹용으로 줄인 것) — iMac 2021·매직 키보드·매직 마우스·빨간 서랍장·플립 시계·커피잔·펜꽂이
  - 원본은 `public/models/src/`(저장소에 올리지 않음). 줄이면서 쓰지 않는 텍스처(광택·요철) 제거, 텍스처는 최대 1024px WebP
  - 서랍장은 원본에서 한 덩어리였던 서랍을 `drawer_0`(위)·`drawer_1`·`drawer_2`(아래, 서류 서랍)로 나눠 둠
  - 크기는 실제 치수(cm)로 맞춤(iMac 폭 54.7 · 키보드 41.9 · 서랍장 높이 69 등). iMac은 흰색, 서랍장 서랍은 블루톤(테마 색 CM)
  - 서랍 앞부분은 5.5cm 두께로 얇게(`DRT`), 서류 서랍은 폴더가 다 보일 만큼만 열림
- 플립 시계: 방문자 컴퓨터의 실제 시각을 보여 줌(분 단위). Ending에서는 지금 시각 → 18:00으로 빠르게 흐름(18시 이후면 그대로)
- 다운로드 파일: 같은 폴더에 `resume.pdf`, `cover-letter.pdf` 를 넣으면 About 서랍의 이력서·자기소개서 창에서 다운로드 버튼이 동작
- 프로젝트 표지: `covers/이름.jpg`(상세용 2560px), `covers/이름-sm.jpg`(모니터 배경용 1280px)
- 명함 이미지: `card-front.png`, `card-back.png` 를 넣으면 자동 적용
- EmailJS 키는 `.env.local`에만 보관 (저장소에 올리지 않기)
- 화면 스타일: 기본은 매트캡 v2(`matcap/v2/` 금속·플라스틱·종이). 비교용으로 주소 끝에 `?style=basic`(평면 일러스트), `?style=retro`(레트로), `?style=matcap`(매트캡 v1)
