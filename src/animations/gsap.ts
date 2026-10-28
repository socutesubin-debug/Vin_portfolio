import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// GSAP 플러그인은 이곳에서 한 번만 등록한다.
gsap.registerPlugin(ScrollTrigger, useGSAP)
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger, useGSAP }

// 개발 중 브라우저 검증용
if (import.meta.env.DEV) Object.assign(window, { __gsap: { gsap, ScrollTrigger } })
