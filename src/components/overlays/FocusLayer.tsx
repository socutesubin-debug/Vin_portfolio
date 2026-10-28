import { useExperience } from '../../state/experienceStore'
import BusinessCardDetail from './BusinessCardDetail'
import ResumeDetail from './ResumeDetail'
import ProjectFocus from './ProjectFocus'
import CallOverlay from './CallOverlay'

/** 한 번에 하나의 Focus만 렌더링한다. */
export default function FocusLayer() {
  const focus = useExperience((s) => s.focus)
  switch (focus.type) {
    case 'card':
      return <BusinessCardDetail key={focus.context} context={focus.context} />
    case 'resume':
      return <ResumeDetail />
    case 'project':
      return <ProjectFocus slug={focus.slug} />
    case 'call':
      return <CallOverlay />
    default:
      return null
  }
}
