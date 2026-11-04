import { PROFILE, type ResumeEntry } from '../../data/profile'

const Pending = ({ what }: { what: string }) => <p className="v5-placeholder">{what} 확인 필요</p>

function Entries({ items, what }: { items: ResumeEntry[]; what: string }) {
  if (!items.length) return <Pending what={what} />
  return (
    <ul className="v5-entries">
      {items.map((e) => (
        <li key={e.title}>
          {e.period && <span className="v5-period">{e.period}</span>}
          <strong>{e.title}</strong>
          {e.detail && <span>{e.detail}</span>}
        </li>
      ))}
    </ul>
  )
}

/** 이력서. src/data/profile.ts의 확인된 값만 쓴다 */
export function Resume() {
  const r = PROFILE.resume
  return (
    <article className="v5-doc v5-resume">
      <header>
        <p className="v5-resume-name">{PROFILE.nameEn}</p>
        <p>{PROFILE.message}</p>
        <dl>
          <dt>직무</dt>
          <dd>{PROFILE.role ?? <span className="v5-placeholder-inline">확인 필요</span>}</dd>
          <dt>이메일</dt>
          <dd>{PROFILE.email ?? <span className="v5-placeholder-inline">공개 주소 확인 필요</span>}</dd>
        </dl>
      </header>
      <h2>Profile</h2>
      {r.profile ? <p>{r.profile}</p> : <Pending what="자기소개" />}
      <h2>Education</h2>
      <Entries items={r.education} what="학력" />
      <h2>Experience</h2>
      <Entries items={r.experience} what="경력·활동" />
      <h2>Skills</h2>
      {r.skills.length ? (
        <ul className="v5-tags">
          {r.skills.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      ) : (
        <Pending what="사용 도구·역량" />
      )}
    </article>
  )
}
