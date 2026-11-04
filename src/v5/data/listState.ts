import type { CategoryId } from './projects'

/**
 * 프로젝트 목록 상태(필터·스크롤·마지막으로 연 카드). 상세에서 목록으로 돌아올 때 복원한다.
 * 탭을 닫으면 사라지도록 sessionStorage에 둔다.
 */
export type Filter = CategoryId | 'all'
interface ListState {
  filter: Filter
  scroll: number
  lastId: string | null
  /** 카드에서 상세로 들어갔다가 돌아오는 중인지 */
  returning: boolean
}

const KEY = 'v5.projects'
const DEFAULT: ListState = { filter: 'all', scroll: 0, lastId: null, returning: false }

export function readList(): ListState {
  try {
    return { ...DEFAULT, ...JSON.parse(sessionStorage.getItem(KEY) ?? '{}') }
  } catch {
    return DEFAULT
  }
}

export function writeList(patch: Partial<ListState>) {
  sessionStorage.setItem(KEY, JSON.stringify({ ...readList(), ...patch }))
}
