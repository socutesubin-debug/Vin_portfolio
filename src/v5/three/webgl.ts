/** WebGL을 쓸 수 있는지. ?nowebgl 로 폴백 화면을 강제로 볼 수 있다 */
export function hasWebGL(): boolean {
  if (new URLSearchParams(location.search).has('nowebgl')) return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
