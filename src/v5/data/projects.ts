import { PROJECTS as V2_PROJECTS, type CategoryId, type Project as V2Project } from '../../v2/data/projects'

/**
 * V5 프로젝트 데이터. 목록·상세는 src/v2/data/projects.ts의 항목을 그대로 쓰고,
 * 상세(케이스 스터디) 칸만 여기서 덧붙인다. 확인되지 않은 칸은 null → 화면에 '확인 필요'로 보인다.
 * 프로젝트 수·기여 범위·조사 수치·피드백·성과는 지어내지 않는다.
 */

/** 파일 탭·필터에 보이는 분류. 이름은 영어로 통일(확정 전 임시) */
export const CATEGORIES: { id: CategoryId; label: string; color: string }[] = [
  { id: 'uxui', label: 'UX/UI', color: '#8fb3e8' },
  { id: 'branding', label: 'Branding', color: '#f0b45a' },
  { id: 'fashion', label: 'Fashion', color: '#e89aa8' },
]
/** 분류 이름이 아직 확정되지 않았음을 화면에 표시한다 */
export const CATEGORIES_PROVISIONAL = true

export type ProjectKind = '개인 작업' | '수업 과제' | '가상 프로젝트' | '팀 프로젝트'

export interface CaseStudy {
  kind: ProjectKind | null
  team: string | null
  /** 문제와 목표 */
  problem: string | null
  /** 조사와 관찰(확인된 내용만) */
  research: string | null
  /** 디자인 판단 */
  decisions: string | null
  /** 흐름과 주요 화면 */
  flow: string | null
  /** 피드백과 수정(실제로 받은 것만) */
  feedback: string | null
  /** 결과와 배운 점 */
  result: string | null
}

export interface Project extends V2Project {
  /** 데이터가 임시(자리표시)인지 */
  placeholder: boolean
  study: CaseStudy
}

const EMPTY_STUDY: CaseStudy = {
  kind: null, team: null, problem: null, research: null, decisions: null, flow: null, feedback: null, result: null,
}

/** 케이스 스터디 원고가 생기면 id별로 채운다 */
const STUDIES: Partial<Record<string, Partial<CaseStudy>>> = {}

const ORDER: CategoryId[] = ['uxui', 'branding', 'fashion'] // UX/UI 직무에 맞는 작업을 앞에

const nth = new Map<CategoryId, number>()
export const PROJECTS: Project[] = [...V2_PROJECTS]
  .sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category))
  .map((p) => {
    const placeholder = p.title.includes('임시')
    const n = (nth.get(p.category) ?? 0) + 1
    nth.set(p.category, n)
    const label = CATEGORIES.find((c) => c.id === p.category)!.label
    return {
      ...p,
      // 임시 항목은 영어 분류명 기준 이름으로 보인다(V2 데이터의 '브랜딩·그래픽 프로젝트 1 (임시)' 등)
      title: placeholder ? `${label} 프로젝트 ${String(n).padStart(2, '0')}` : p.title,
      summary: placeholder ? '한 줄 소개 준비 중' : p.summary,
      placeholder,
      study: { ...EMPTY_STUDY, ...STUDIES[p.id] },
    }
  })

export const categoryOf = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!
export const findProject = (id: string | undefined) => PROJECTS.find((p) => p.id === id) ?? null
export type { CategoryId }
