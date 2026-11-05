# VIN 책상 흐름 (3D 프로토타입)

three.js 책상 장면 하나로 이어지는 포트폴리오 흐름.
Home → About(모니터) → Work(서랍) → Projects → Contact(전화) → Ending(퇴근)

- 실행: `index.html`을 정적 서버로 열기 (예: `npx serve prototype/desk-flow`)
- `models.js`: 3D 모델(스탠드·iMac·전화기·책상·의자) base64
- 다운로드 파일: 같은 폴더에 `resume.pdf`, `cover-letter.pdf` 를 넣으면 About의 다운로드 버튼이 동작
- 명함 이미지: `card-front.png`, `card-back.png` 를 넣으면 자동 적용
- EmailJS 키는 `.env.local`에만 보관 (저장소에 올리지 않기)
