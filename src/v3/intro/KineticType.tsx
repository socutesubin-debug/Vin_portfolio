import { forwardRef, useImperativeHandle, useRef, type CSSProperties } from 'react'
import { INTRO_TYPE } from './introConfig'

export interface KineticTypeHandle {
  /** c1~c2 안의 진행률(0~1)을 받아 글자 위치를 바꾼다 */
  update: (t: number) => void
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeIn = (t: number) => t * t * t

/**
 * PARK SU VIN → VISION INSIDE → VIN.
 * 한 줄씩 아래에서 올라와 자리를 잡고, 끝날 때는 위로 빠져나간다. 스크롤에 묶여 있어 되돌리면 거꾸로 움직인다.
 */
const KineticType = forwardRef<KineticTypeHandle, { mobile: boolean }>(function KineticType({ mobile }, ref) {
  const lineRefs = useRef<(HTMLSpanElement | null)[][]>([])

  useImperativeHandle(ref, () => ({
    update(t) {
      const T = INTRO_TYPE
      T.items.forEach((item, i) => {
        const span = item.end - item.start
        const enter = span * T.enter
        const exit = span * T.exit
        const stagger = span * T.stagger
        item.lines.forEach((_, j) => {
          const el = lineRefs.current[i]?.[j]
          if (!el) return
          const lag = j * stagger
          const inT = easeOut(clamp01((t - item.start - lag) / enter))
          const outT = easeIn(clamp01((t - (item.end - exit) - lag) / exit))
          // 아래(+110%)에서 올라와 0에 머물고, 위(-110%)로 나간다
          const y = (1 - inT) * 110 - outT * 110
          el.style.transform = `translate3d(0, ${y.toFixed(2)}%, 0)`
          el.style.visibility = inT > 0 && outT < 1 ? 'visible' : 'hidden'
        })
      })
    },
  }))

  const pos = mobile ? INTRO_TYPE.mobilePosition : INTRO_TYPE.position
  const style: CSSProperties = {
    color: INTRO_TYPE.color,
    fontSize: mobile ? INTRO_TYPE.mobileSize : INTRO_TYPE.size,
    top: pos.y,
    textAlign: pos.align,
    ...(pos.align === 'left' && { left: pos.x }),
    ...(pos.align === 'right' && { right: pos.x }),
    ...(pos.align === 'center' && { left: 0, right: 0 }),
  }

  return (
    <div className="v3-type" style={style} aria-hidden="true">
      {INTRO_TYPE.items.map((item, i) => (
        <p key={i} className="v3-type-item">
          {item.lines.map((line, j) => (
            <span key={j} className="v3-type-mask">
              <span
                ref={(el) => {
                  ;(lineRefs.current[i] ??= [])[j] = el
                }}
                className="v3-type-line"
              >
                {line}
              </span>
            </span>
          ))}
        </p>
      ))}
    </div>
  )
})

export default KineticType
