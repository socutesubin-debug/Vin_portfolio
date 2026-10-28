import { useRef } from 'react'
import { gsap, useGSAP } from '../../animations/gsap'
import { PROFILE, type ResumeEntry } from '../../data/profile'
import { useExperience } from '../../state/experienceStore'
import Dialog, { CloseButton } from './Dialog'

const Todo = ({ children }: { children: string }) => <p className="todo">TODO · {children}</p>

function Entries({ items, todo }: { items: ResumeEntry[]; todo: string }) {
  if (!items.length) return <Todo>{todo}</Todo>
  return (
    <ul className="resume__entries">
      {items.map((e) => (
        <li key={e.title}>
          {e.period && <span className="resume__period">{e.period}</span>}
          <strong>{e.title}</strong>
          {e.detail && <p>{e.detail}</p>}
        </li>
      ))}
    </ul>
  )
}

/** 이력서 본문. 이력서 집중 화면과 스크롤 중 미리보기(peek)가 같은 내용을 쓴다. */
export function ResumeSheet({ titleId, peek = false }: { titleId?: string; peek?: boolean }) {
  const { resume } = PROFILE
  return (
    <article className={`sheet resume${peek ? ' resume--peek' : ''}`} tabIndex={peek ? undefined : -1}>
        <header className="resume__head">
          <div className="resume__photo">
            {PROFILE.photo ? <img src={PROFILE.photo} alt={`${PROFILE.nameDisplay} 프로필 사진`} /> : <span>Photo · TODO</span>}
          </div>
          <div>
            <p className="eyebrow">RESUME</p>
            <h2 id={titleId} className="resume__name">
              {PROFILE.nameEn}
            </h2>
            <p className="resume__role">{PROFILE.role ?? '직무 · 정보 확인 중'}</p>
          </div>
        </header>

        <section className="resume__row">
          <h3>Profile</h3>
          {resume.profile ? <p>{resume.profile}</p> : <Todo>자기소개 원문</Todo>}
        </section>
        <section className="resume__row">
          <h3>Education</h3>
          <Entries items={resume.education} todo="학력" />
        </section>
        <section className="resume__row">
          <h3>Experience</h3>
          <Entries items={resume.experience} todo="경력·활동" />
        </section>
        <section className="resume__row">
          <h3>Design Philosophy</h3>
          {resume.philosophy ? <p>{resume.philosophy}</p> : <Todo>디자인 철학</Todo>}
        </section>
        <section className="resume__row">
          <h3>Skills</h3>
          {resume.skills.length ? (
            <ul className="resume__skills">
              {resume.skills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : (
            <Todo>사용 도구·역량</Todo>
          )}
        </section>
    </article>
  )
}

/** About 이력서 집중 화면. 읽기용 HTML 문서이며 내부 스크롤을 허용한다. */
export default function ResumeDetail() {
  const closeFocus = useExperience((s) => s.closeFocus)
  const reduced = useExperience((s) => s.reducedMotion)
  const wrap = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.from('.sheet', { y: 60, scale: 0.94, opacity: 0, duration: reduced ? 0 : 0.6, ease: 'power3.out' })
    },
    { scope: wrap },
  )

  return (
    <Dialog labelledBy="resume-title" onClose={closeFocus} className="overlay--doc">
      <CloseButton onClick={closeFocus} label="이력서 닫기" />
      <div ref={wrap} className="resume-wrap">
        <ResumeSheet titleId="resume-title" />
      </div>
    </Dialog>
  )
}
