import { INK_FILTER_ID } from '../../animations/inkBleed'

/**
 * 잉크 번짐 SVG 필터. 값은 applyInk()가 스크롤 진행률에 맞춰 바꾼다.
 * 노이즈로 가장자리를 유기적으로 흔들고 → 살짝 흐린 뒤 알파 대비를 올려 잉크가 고인 외곽을 만들고
 * → 넓게 퍼진 옅은 잉크(halo)와 저주파 노이즈의 농도 차이를 더한다.
 */
export default function InkBleedFilter() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <filter id={INK_FILTER_ID} x="-8%" y="-20%" width="116%" height="140%" colorInterpolationFilters="sRGB">
        <feTurbulence id="ink-turb" type="fractalNoise" baseFrequency="0.045" numOctaves={2} seed={7} result="grain" />
        <feDisplacementMap id="ink-disp" in="SourceGraphic" in2="grain" scale="5" xChannelSelector="R" yChannelSelector="G" result="rough" />
        <feGaussianBlur id="ink-core" in="rough" stdDeviation="1.5" result="soft" />
        <feComponentTransfer in="soft" result="core">
          <feFuncA type="linear" slope="1.7" intercept="-0.08" />
        </feComponentTransfer>
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={1} seed={3} result="tone" />
        <feComposite id="ink-density" in="core" in2="tone" operator="arithmetic" k1="0.5" k2="0.75" k3="0" k4="0" result="inked" />
        <feGaussianBlur id="ink-halo" in="rough" stdDeviation="6" result="haloBlur" />
        <feComponentTransfer in="haloBlur" result="halo">
          <feFuncA id="ink-halo-a" type="linear" slope="0.32" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="halo" />
          <feMergeNode in="inked" />
        </feMerge>
      </filter>
    </svg>
  )
}
