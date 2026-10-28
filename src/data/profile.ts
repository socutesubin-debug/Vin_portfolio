// 명함·이력서에 쓰이는 개인 정보.
// 노션 시안/사용자가 제공한 문구만 채운다. null·빈 배열은 아직 확인되지 않은 항목(TODO)이다.

export type LinkItem = { label: string; url: string }

export type ResumeEntry = { period?: string; title: string; detail?: string }

export const PROFILE = {
  brand: 'VIN',
  meaning: 'Vision Inside',
  concept: 'Explore to Evolve',
  message: 'I turn ideas into experiences.',
  nameEn: 'PARK SU VIN',
  nameDisplay: 'Suvin Park',

  // TODO: 실제 직무명 확인
  role: null as string | null,
  // TODO: 실제 이메일 확인
  email: null as string | null,
  // TODO: 포트폴리오·SNS 링크 확인
  links: [] as LinkItem[],
  // TODO: 사진 사용 여부 확인 후 public/images/profile.jpg 등으로 지정
  photo: null as string | null,

  resume: {
    // TODO: 자기소개 원문
    profile: null as string | null,
    // TODO: 학력
    education: [] as ResumeEntry[],
    // TODO: 경력·활동
    experience: [] as ResumeEntry[],
    // TODO: 사용 도구·역량
    skills: [] as string[],
    // TODO: 디자인 철학
    philosophy: null as string | null,
  },
}
