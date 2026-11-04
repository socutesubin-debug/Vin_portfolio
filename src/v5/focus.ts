/**
 * 포커스 규칙
 * - 새 화면에 도착하면 그 화면의 제목(h1[data-screen-title])으로 포커스를 옮긴다.
 * - 패널을 연 버튼·링크를 기억해 두었다가, 패널이 닫혀 원래 화면으로 돌아오면 그 버튼으로 돌려준다.
 */
let opener: HTMLElement | null = null

/** 패널·화면을 여는 버튼에서 호출한다(클릭·Enter 모두) */
export function rememberOpener(el: Element | null) {
  opener = el instanceof HTMLElement ? el : null
}

/** 원래 버튼이 아직 화면에 있으면 그쪽으로, 아니면 제목으로 */
export function focusArrival(root: ParentNode = document, preferOpener = false) {
  requestAnimationFrame(() => {
    if (preferOpener && opener && opener.isConnected && opener.offsetParent !== null) {
      opener.focus({ preventScroll: true })
      opener = null
      return
    }
    // 화면 코드는 지연 로드되므로 제목이 나타날 때까지 몇 프레임 기다린다(최대 약 2초).
    // 로딩 중에는 Suspense가 이전 화면을 display:none으로 남겨 두므로 보이는 제목만 고른다
    let tries = 120
    const tryFocus = () => {
      const title = [...root.querySelectorAll<HTMLElement>('[data-screen-title]')].find((t) => t.offsetParent !== null)
      if (title) title.focus({ preventScroll: true })
      else if (--tries > 0) requestAnimationFrame(tryFocus)
    }
    tryFocus()
  })
}

export function focusElement(el: HTMLElement | null | undefined) {
  if (!el) return
  requestAnimationFrame(() => el.focus({ preventScroll: true }))
}
