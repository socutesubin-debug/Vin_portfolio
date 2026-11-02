import { unlockAudio } from '../audio/ringtone'
import { useWorkspace } from '../state/workspaceStore'

/** 사운드 켜기/끄기(기본 꺼짐). 켜는 순간 브라우저 오디오를 깨운다 */
export default function SoundToggle() {
  const on = useWorkspace((s) => s.soundOn)
  const setOn = useWorkspace((s) => s.setSoundOn)

  return (
    <button
      type="button"
      className="v2-sound"
      aria-pressed={on}
      aria-label={on ? '사운드 끄기' : '사운드 켜기'}
      title={on ? '사운드 끄기' : '사운드 켜기'}
      onClick={() => {
        if (!on) unlockAudio()
        setOn(!on)
      }}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        {on ? (
          <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        ) : (
          <path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        )}
      </svg>
    </button>
  )
}
