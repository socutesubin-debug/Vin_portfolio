import { PROFILE } from '../../data/profile'

/** 자기소개서. 원고가 확인되기 전까지 자리표시만 보인다(문장을 지어내지 않는다) */
export function CoverLetter() {
  return (
    <article className="v5-doc">
      <p className="v5-doc-lead">
        {PROFILE.nameDisplay} · {PROFILE.brand} ({PROFILE.meaning}) — {PROFILE.concept}
      </p>
      <p className="v5-placeholder" role="note">
        자기소개서 원고 준비 중 — 지원 동기, 디자인 관점, UX/UI 직무에서 하고 싶은 일을 이 자리에 넣습니다.
      </p>
      <div className="v5-doc-links">
        <a href="#resume">이력서 보기 →</a>
        <a href="#projects">프로젝트 보기 →</a>
      </div>
    </article>
  )
}
