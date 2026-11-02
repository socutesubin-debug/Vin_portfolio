/**
 * WORK 서랍에 들어가는 프로젝트. 이 파일만 고치면 프로젝트를 추가·수정·삭제할 수 있다.
 *
 * - 프로젝트를 추가하면 서랍 안 칸막이 위치와 카드 간격, 전체 보기 필터 개수가 자동으로 맞춰진다.
 * - 대표 이미지는 public/v2/projects/ 폴더에 넣고 cover에 '/v2/projects/파일이름.jpg'처럼 적는다.
 *   아직 없으면 null로 두면 "준비 중" 자리표시가 나온다.
 * - 지금 들어 있는 프로젝트는 모두 임시다. 실제 내용으로 바꿔야 한다.
 */

export type CategoryId = 'uxui' | 'branding' | 'fashion'

export interface Category {
  id: CategoryId
  /** 칸막이 인덱스 탭, 필터 칩, 상세 화면에 보이는 이름 */
  label: string
  /** 칸막이 탭과 카드 탭 띠 색 */
  color: string
}

/** 서랍 안에서 앞쪽부터 이 순서로 꽂힌다. 필터 칩 순서도 같다 */
export const CATEGORIES: Category[] = [
  { id: 'uxui', label: 'UX/UI', color: '#8fb3e8' },
  { id: 'branding', label: '브랜딩·그래픽', color: '#f0b45a' },
  { id: 'fashion', label: '패션', color: '#e89aa8' },
]

export interface Project {
  /** 영문·숫자·하이픈으로 된 고유 이름 */
  id: string
  category: CategoryId
  title: string
  /** 카드 탭에 보일 짧은 이름. 없으면 title을 쓴다 */
  tab?: string
  /** 카드 탭에 이름과 함께 보이는 연도 */
  year: string
  /** 한 줄 소개 */
  summary: string
  role: string
  period: string
  /** 사용 툴 */
  tools: string[]
  /** 대표 이미지 경로. 없으면 null */
  cover: string | null
  /** 본문 문단 */
  body: string[]
}

const TEMP_BODY = [
  '임시 본문입니다. 프로젝트 배경, 문제 정의, 과정, 결과를 이 자리에 적어 주세요.',
  '문단은 배열에 문자열을 하나씩 추가하면 됩니다.',
]

export const PROJECTS: Project[] = [
  {
    id: 'uxui-temp-1',
    category: 'uxui',
    title: 'UX/UI 프로젝트 1 (임시)',
    tab: 'UX/UI 01',
    year: '20XX',
    summary: '임시 한 줄 소개입니다.',
    role: '역할 (임시)',
    period: '기간 (임시)',
    tools: ['툴 (임시)'],
    cover: null,
    body: TEMP_BODY,
  },
  {
    id: 'uxui-temp-2',
    category: 'uxui',
    title: 'UX/UI 프로젝트 2 (임시)',
    tab: 'UX/UI 02',
    year: '20XX',
    summary: '임시 한 줄 소개입니다.',
    role: '역할 (임시)',
    period: '기간 (임시)',
    tools: ['툴 (임시)'],
    cover: null,
    body: TEMP_BODY,
  },
  {
    id: 'uxui-temp-3',
    category: 'uxui',
    title: 'UX/UI 프로젝트 3 (임시)',
    tab: 'UX/UI 03',
    year: '20XX',
    summary: '임시 한 줄 소개입니다.',
    role: '역할 (임시)',
    period: '기간 (임시)',
    tools: ['툴 (임시)'],
    cover: null,
    body: TEMP_BODY,
  },
  {
    id: 'branding-temp-1',
    category: 'branding',
    title: '브랜딩·그래픽 프로젝트 1 (임시)',
    tab: 'BRAND 01',
    year: '20XX',
    summary: '임시 한 줄 소개입니다.',
    role: '역할 (임시)',
    period: '기간 (임시)',
    tools: ['툴 (임시)'],
    cover: null,
    body: TEMP_BODY,
  },
  {
    id: 'branding-temp-2',
    category: 'branding',
    title: '브랜딩·그래픽 프로젝트 2 (임시)',
    tab: 'BRAND 02',
    year: '20XX',
    summary: '임시 한 줄 소개입니다.',
    role: '역할 (임시)',
    period: '기간 (임시)',
    tools: ['툴 (임시)'],
    cover: null,
    body: TEMP_BODY,
  },
  {
    id: 'fashion-temp-1',
    category: 'fashion',
    title: '패션 프로젝트 1 (임시)',
    tab: 'FASHION 01',
    year: '20XX',
    summary: '임시 한 줄 소개입니다.',
    role: '역할 (임시)',
    period: '기간 (임시)',
    tools: ['툴 (임시)'],
    cover: null,
    body: TEMP_BODY,
  },
  {
    id: 'fashion-temp-2',
    category: 'fashion',
    title: '패션 프로젝트 2 (임시)',
    tab: 'FASHION 02',
    year: '20XX',
    summary: '임시 한 줄 소개입니다.',
    role: '역할 (임시)',
    period: '기간 (임시)',
    tools: ['툴 (임시)'],
    cover: null,
    body: TEMP_BODY,
  },
]

export const categoryOf = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!
export const findProject = (id: string | null) => PROJECTS.find((p) => p.id === id) ?? null
