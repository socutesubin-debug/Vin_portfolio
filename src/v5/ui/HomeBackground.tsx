import { useLayoutEffect, useRef, useState } from 'react'
import { coverRect, HOME_BG, type CoverRect } from '../home/config'

/**
 * Home 배경 사진. object-fit 대신 coverRect로 직접 배치한다(3D 카메라가 같은 영역을 쓴다).
 * 사진을 못 불러오면 비슷한 색의 단색 배경이 남는다.
 */
export function HomeBackground() {
  const box = useRef<HTMLDivElement>(null)
  const [rect, setRect] = useState<CoverRect | null>(null)

  useLayoutEffect(() => {
    const el = box.current!
    const update = () => setRect(coverRect(el.clientWidth, el.clientHeight))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="v5-home-bg" ref={box} aria-hidden="true">
      {rect && (
        <picture>
          <source srcSet={HOME_BG.webp} type="image/webp" />
          <img
            src={HOME_BG.png}
            alt=""
            width={HOME_BG.width}
            height={HOME_BG.height}
            fetchPriority="high"
            decoding="async"
            draggable={false}
            style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
          />
        </picture>
      )}
    </div>
  )
}
