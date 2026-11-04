import { useEffect, useState } from 'react'
import { INTRO_MEDIA } from '../intro/introConfig'

/**
 * 개발용: S04 카메라를 맞추기 위해 k5_desk.png를 3D 위에 반투명하게 겹쳐 본다.
 * 단축키 K로도 켜고 끈다. 주소에 ?k5=0.5처럼 붙이면 그 투명도로 켜진 채 시작한다.
 */
export default function DevHomeReference() {
  const fromUrl = Number(new URLSearchParams(window.location.search).get('k5'))
  const [on, setOn] = useState(fromUrl > 0)
  const [opacity, setOpacity] = useState(fromUrl > 0 ? fromUrl : 0.5)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setOn((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {on && <img className="v3-k5" src={INTRO_MEDIA.homeReference} alt="" style={{ opacity }} />}
      <div className="v3-devbar">
        <label>
          <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} /> k5 겹쳐보기 (K)
        </label>
        {on && (
          <input
            type="range"
            min={0.1}
            max={0.9}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(+e.target.value)}
            aria-label="k5 투명도"
          />
        )}
      </div>
    </>
  )
}
