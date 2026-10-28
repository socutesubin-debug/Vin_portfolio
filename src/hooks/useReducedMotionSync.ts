import { useEffect } from 'react'
import { useExperience } from '../state/experienceStore'

/** prefers-reduced-motion을 스토어와 동기화한다. */
export function useReducedMotionSync() {
  const setReduced = useExperience((s) => s.setReducedMotion)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [setReduced])
}
