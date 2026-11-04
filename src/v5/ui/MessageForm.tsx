import { forwardRef, useState, type FormEvent } from 'react'
import { PROFILE } from '../../data/profile'
import { sendMessage, type SendResult } from '../contact/send'

type Field = 'email' | 'message'
type Errors = Partial<Record<Field, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(email: string, message: string): Errors {
  const e: Errors = {}
  if (!email.trim()) e.email = '회신받을 이메일을 입력해 주세요.'
  else if (!EMAIL_RE.test(email.trim())) e.email = '이메일 형식을 확인해 주세요. 예: name@example.com'
  if (!message.trim()) e.message = '메시지를 입력해 주세요.'
  return e
}

const RESULT_TEXT: Record<SendResult, string> = {
  sent: '메시지가 접수됐어요. 남겨 주신 이메일로 답장드릴게요.',
  'not-configured': '아직 전송 서비스가 연결되지 않아 메시지를 보내지 않았어요. 입력한 내용은 그대로 남아 있어요.',
  failed: '메시지를 보내지 못했어요. 입력한 내용은 그대로 있으니 잠시 후 다시 시도해 주세요.',
}

/**
 * 메시지 양식. 이름·소속(선택), 회신 이메일(필수), 메시지(필수).
 * 제출 중에는 버튼을 잠가 중복 제출을 막고, 실패·미연결이면 입력을 유지한다.
 */
export const MessageForm = forwardRef<HTMLHeadingElement, { onClose: () => void }>(function MessageForm({ onClose }, titleRef) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [state, setState] = useState<'idle' | 'sending' | SendResult>('idle')

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (state === 'sending') return
    const errs = validate(email, message)
    setErrors(errs)
    const first = (Object.keys(errs) as Field[])[0]
    if (first) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    setState('sending')
    const result = await sendMessage({ name: name.trim(), email: email.trim(), message: message.trim() })
    setState(result)
    if (result === 'sent') {
      setName('')
      setEmail('')
      setMessage('')
    }
  }

  const sending = state === 'sending'
  return (
    <div className="v5-msg">
      <div className="v5-msg-head">
        <h2 ref={titleRef} tabIndex={-1} id="msg-title">
          메시지 남기기
        </h2>
        <button type="button" className="v5-icon-btn" onClick={onClose} aria-label="메시지 양식 닫기">
          ✕
        </button>
      </div>
      <p className="v5-msg-lead">잠시 자리를 비웠어요. 메시지를 남겨주시면 이메일로 답장드릴게요.</p>
      <form className="v5-msg-form" noValidate onSubmit={submit} aria-labelledby="msg-title">
        <div className="v5-msg-to">
          <span className="v5-msg-label">To</span>
          <span>
            {PROFILE.nameDisplay} <span className="v5-placeholder-inline">· 공개 연락처 확인 후 표시</span>
          </span>
        </div>
        <label className="v5-field">
          <span className="v5-msg-label">
            이름·소속 <span className="v5-opt">선택</span>
          </span>
          <input name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="v5-field">
          <span className="v5-msg-label">
            회신 이메일 <span className="v5-req">필수</span>
          </span>
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'err-email' : undefined}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((x) => ({ ...x, email: undefined }))
            }}
          />
          {errors.email && (
            <span className="v5-err" id="err-email">
              {errors.email}
            </span>
          )}
        </label>
        <label className="v5-field v5-field-grow">
          <span className="v5-msg-label">
            메시지 <span className="v5-req">필수</span>
          </span>
          <textarea
            name="message"
            rows={6}
            required
            aria-required="true"
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'err-message' : undefined}
            placeholder="안녕하세요! 포트폴리오 잘 봤어요."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              if (errors.message) setErrors((x) => ({ ...x, message: undefined }))
            }}
          />
          {errors.message && (
            <span className="v5-err" id="err-message">
              {errors.message}
            </span>
          )}
        </label>
        <div className="v5-msg-foot">
          <p className="v5-msg-status" role="status" data-state={state}>
            {sending ? '보내는 중…' : state !== 'idle' ? RESULT_TEXT[state] : ''}
          </p>
          <button type="submit" className="v5-btn v5-btn-primary" disabled={sending} aria-disabled={sending}>
            {sending ? '보내는 중…' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
})
