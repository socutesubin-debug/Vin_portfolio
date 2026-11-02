import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { CONTACT } from '../config/contact'
import { emailConfigured, sendMessage } from '../lib/sendMessage'
import { useWorkspace } from '../state/workspaceStore'

type Field = 'name' | 'email' | 'message'
type Status = 'idle' | 'sending' | 'success' | 'error' | 'cooldown'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const COOLDOWN_KEY = 'vin-v2-message-sent-at'

function validate(v: Record<Field, string>) {
  const e: Partial<Record<Field, string>> = {}
  if (!v.name.trim()) e.name = '이름을 적어 주세요.'
  if (!v.email.trim()) e.email = '답장 받을 이메일을 적어 주세요.'
  else if (!EMAIL_RE.test(v.email.trim())) e.email = '이메일 형식을 확인해 주세요. (예: name@example.com)'
  if (!v.message.trim()) e.message = '메시지를 적어 주세요.'
  return e
}

const lastSent = () => {
  try {
    return Number(window.localStorage.getItem(COOLDOWN_KEY)) || 0
  } catch {
    return 0
  }
}

/**
 * 부재중 메시지 카드(전화 메모 용지). 수화기를 들면 나타난다.
 * 항상 그려 두고 보이기만 바꿔서, 닫았다 다시 열어도 쓰던 내용이 남아 있다.
 */
export default function MessageCard() {
  const open = useWorkspace((s) => s.callOpen)
  const { hangUp, silenceRing } = useWorkspace.getState()
  const [values, setValues] = useState<Record<Field, string>>({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [status, setStatus] = useState<Status>('idle')
  const [copied, setCopied] = useState(false)
  const [trap, setTrap] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const refs = { name: nameRef, email: useRef<HTMLInputElement>(null), message: useRef<HTMLTextAreaElement>(null) }

  // 열리면 이름 칸으로 포커스, 닫히면 "전화 받기" 버튼으로 돌려준다
  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 80)
      return () => window.clearTimeout(id)
    }
    document.querySelector<HTMLElement>('.v2-call-btn')?.focus({ preventScroll: true })
    if (status === 'success' || status === 'error') setStatus('idle')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const set = (f: Field) => (v: string) => {
    silenceRing()
    setValues((s) => ({ ...s, [f]: v }))
    if (errors[f]) setErrors((e) => ({ ...e, [f]: undefined }))
  }

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    if (status === 'sending') return
    const errs = validate(values)
    setErrors(errs)
    const first = (Object.keys(errs) as Field[])[0]
    if (first) return refs[first].current?.focus()
    if (Date.now() - lastSent() < CONTACT.resendCooldown * 1000) return setStatus('cooldown')

    setStatus('sending')
    try {
      // 사람 눈에 안 보이는 칸이 채워졌으면 스팸으로 보고 보내지 않는다(성공처럼 보이게)
      if (!trap) await sendMessage({ name: values.name.trim(), email: values.email.trim(), message: values.message.trim() })
      try {
        window.localStorage.setItem(COOLDOWN_KEY, String(Date.now()))
      } catch {
        // 저장 불가 환경
      }
      setStatus('success')
      window.setTimeout(() => {
        setValues({ name: '', email: '', message: '' })
        hangUp()
      }, CONTACT.successHold)
    } catch {
      setStatus('error')
    }
  }

  // 메시지 칸은 Enter가 줄바꿈이라 Ctrl/⌘+Enter로 보낸다
  const onMessageKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const mailto = `mailto:${CONTACT.email}?subject=${encodeURIComponent(CONTACT.mailSubject)}`
  const sending = status === 'sending'
  const done = status === 'success'

  return (
    <div className={`v2-call${open ? ' is-open' : ''}`} aria-hidden={!open} inert={!open}>
      {/* 카드 밖을 누르면 닫힌다 */}
      <div className="v2-call__backdrop" onClick={hangUp} />
      <section className="v2-memo" role="dialog" aria-modal="true" aria-labelledby="v2-memo-title">
        <div className="v2-memo__clip" aria-hidden="true" />
        <header className="v2-memo__head">
          <span className="v2-memo__kicker">WHILE YOU WERE OUT</span>
          <h2 id="v2-memo-title">{CONTACT.copy.title}</h2>
          <p>{CONTACT.copy.lead}</p>
          <button type="button" className="v2-memo__close" onClick={hangUp} aria-label="닫고 수화기 내려놓기">
            ✕
          </button>
        </header>

        {done ? (
          <p className="v2-memo__done" role="status">
            <span aria-hidden="true">✓</span> {CONTACT.copy.success}
          </p>
        ) : (
          <form ref={formRef} className="v2-memo__form" onSubmit={submit} noValidate>
            <label className="v2-memo__field">
              <span>이름</span>
              <input
                ref={nameRef}
                name="name"
                autoComplete="name"
                value={values.name}
                onChange={(e) => set('name')(e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'memo-err-name' : undefined}
                required
              />
              {errors.name && <em id="memo-err-name">{errors.name}</em>}
            </label>
            <label className="v2-memo__field">
              <span>이메일</span>
              <input
                ref={refs.email}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => set('email')(e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'memo-err-email' : undefined}
                required
              />
              {errors.email && <em id="memo-err-email">{errors.email}</em>}
            </label>
            <label className="v2-memo__field">
              <span>메시지</span>
              <textarea
                ref={refs.message}
                name="message"
                rows={5}
                value={values.message}
                onChange={(e) => set('message')(e.target.value)}
                onKeyDown={onMessageKey}
                aria-invalid={!!errors.message}
                aria-describedby={`memo-hint${errors.message ? ' memo-err-message' : ''}`}
                required
              />
              <small id="memo-hint">Ctrl(⌘) + Enter로도 보낼 수 있어요.</small>
              {errors.message && <em id="memo-err-message">{errors.message}</em>}
            </label>
            {/* 스팸 방지용 빈 칸(사람에게는 보이지 않는다) */}
            <input
              className="v2-memo__trap"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={trap}
              onChange={(e) => setTrap(e.target.value)}
            />

            {!emailConfigured && <p className="v2-memo__note">{CONTACT.copy.notConfigured}</p>}
            {status === 'cooldown' && <p className="v2-memo__note" role="status">{CONTACT.copy.cooldown}</p>}
            {status === 'error' && (
              <p className="v2-memo__error" role="alert">
                {CONTACT.copy.failure}
              </p>
            )}

            <button type="submit" className="v2-memo__send" disabled={sending || !emailConfigured} aria-busy={sending}>
              {sending ? (
                <>
                  <span className="v2-spinner" aria-hidden="true" /> 보내는 중…
                </>
              ) : status === 'error' ? (
                '다시 시도'
              ) : (
                'Send'
              )}
            </button>
          </form>
        )}

        <footer className="v2-memo__alt">
          <button type="button" onClick={copy}>
            {copied ? '복사했어요' : `${CONTACT.email} 복사`}
          </button>
          <a href={mailto}>메일 앱으로 직접 보내기 →</a>
        </footer>
      </section>
    </div>
  )
}
