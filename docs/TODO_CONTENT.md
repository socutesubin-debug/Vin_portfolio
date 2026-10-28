# 콘텐츠 TODO (가이드 §6.2, §15)

실제 자료가 들어갈 위치를 함께 적었습니다. 값이 비어 있으면 화면에 `TODO` / `정보 확인 중`이 표시됩니다.

## 명함 · 연락처 — `src/data/profile.ts`
- [ ] 직무명 `role`
- [ ] 이메일 `email`
- [ ] 포트폴리오·SNS 링크 `links`
- [ ] 명함 뒷면 최종 디자인 (현재: 인디고 배경 + 연락처 목록)

## 이력서 — `src/data/profile.ts` → `resume`
- [ ] 자기소개 `profile`
- [ ] 학력 `education`
- [ ] 경력·활동 `experience`
- [ ] 디자인 철학 `philosophy`
- [ ] 사용 도구·역량 `skills`
- [ ] 사진 사용 여부 → 사용 시 `public/images/profile.jpg` 등에 넣고 `photo` 경로 지정 (시안 06에 사진 있음)

## 프로젝트 — `src/data/projects.ts`
각 프로젝트(PACKIT · PRINTCAFE · LE LABO)마다:
- [ ] 성격 `kind` (수업 과제 / 개인 작업 / 가상 프로젝트 등)
- [ ] 기간 `duration` · 팀 `team` · 본인 역할 `role`
- [ ] 대표 이미지 `cover` → `public/images/projects/<slug>/`
- [ ] 본문 `sections` (overview, background, problem, research, insight, strategy, flow, screens, iteration, results, limitations)
- [ ] 추가 이미지 `images`, 외부 링크 `externalUrl`
- 성과·조사 수치는 실제 자료가 있을 때만 입력

## 3D 자산
- [ ] 크롬 프레임 표면이 정돈된 서랍장 GLB (현재 모델은 표면 노이즈 있음, Draco/Meshopt 압축 권장)
- [ ] 다이얼 전화기 모델 (현재 코드로 만든 임시 모델)
- [ ] 폴더 색상·라벨 최종안 (현재 크림색 폴더 + 인덱스 탭)

## 디자인 결정
- [ ] 최종 폰트 (현재 Inter + Playfair Display)
- [ ] 텍스트·그림자·바닥색 최종값
- [ ] 전화기 효과음 도입 여부 (기본 무음)
