// 프로젝트 데이터의 유일한 출처. 화면 컴포넌트에 프로젝트 정보를 중복 작성하지 않는다.
// 본문 필드가 비어 있으면 화면에 TODO 플레이스홀더가 표시된다. 성과·수치를 임의로 채우지 않는다.

export const PROJECT_ORDER = ['packit', 'printcafe', 'le-labo'] as const
export type ProjectSlug = (typeof PROJECT_ORDER)[number]

export type Project = {
  slug: ProjectSlug
  title: string
  label: string // 서랍 속 인덱스 탭 표기
  category: string
  kind?: string // TODO: 수업 과제 / 개인 작업 / 가상 프로젝트 등 성격
  duration?: string
  team?: string
  role?: string
  cover?: string
  images?: string[]
  externalUrl?: string
  sections: Partial<Record<DetailSectionKey, string>>
}

export const DETAIL_SECTIONS = [
  { key: 'overview', title: 'Overview' },
  { key: 'background', title: 'Background & Role' },
  { key: 'problem', title: 'Problem Definition' },
  { key: 'research', title: 'Research & Findings' },
  { key: 'insight', title: 'Key Insights' },
  { key: 'strategy', title: 'Design Strategy' },
  { key: 'flow', title: 'IA / User Flow / Wireframe' },
  { key: 'screens', title: 'Design System & Key Screens' },
  { key: 'iteration', title: 'Feedback & Iteration' },
  { key: 'results', title: 'Results & Learnings' },
  { key: 'limitations', title: 'Limitations' },
] as const
export type DetailSectionKey = (typeof DETAIL_SECTIONS)[number]['key']

export const PROJECTS: Record<ProjectSlug, Project> = {
  packit: {
    slug: 'packit',
    title: 'PACKIT',
    label: 'PACKIT',
    category: 'Travel Shopping Application',
    sections: {},
  },
  printcafe: {
    slug: 'printcafe',
    title: 'PRINTCAFE',
    label: 'PRINTCAFE',
    category: 'UX/UI Redesign',
    sections: {},
  },
  'le-labo': {
    slug: 'le-labo',
    title: 'LE LABO',
    label: 'LE LABO',
    category: 'Interactive Promotion Website',
    sections: {},
  },
}

export const projectIndex = (slug: ProjectSlug) => PROJECT_ORDER.indexOf(slug)
export const isProjectSlug = (s: string | undefined): s is ProjectSlug =>
  !!s && (PROJECT_ORDER as readonly string[]).includes(s)
export const neighborSlug = (slug: ProjectSlug, dir: 1 | -1): ProjectSlug => {
  const n = PROJECT_ORDER.length
  return PROJECT_ORDER[(projectIndex(slug) + dir + n) % n]
}
