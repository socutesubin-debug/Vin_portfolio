import emailjs from '@emailjs/browser'

/**
 * 부재중 메시지를 EmailJS로 보낸다.
 * 키는 .env.local(로컬)과 Vercel 환경 변수에 넣는다. 코드·GitHub에는 올리지 않는다.
 *   VITE_EMAILJS_SERVICE_ID / VITE_EMAILJS_TEMPLATE_ID / VITE_EMAILJS_PUBLIC_KEY
 */

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined

/** 키 세 개가 모두 있어야 카드에서 바로 보낼 수 있다 */
export const emailConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY)

export interface MessageInput {
  name: string
  email: string
  message: string
}

/** EmailJS 템플릿에서 쓰는 변수 이름과 같다 */
export async function sendMessage({ name, email, message }: MessageInput) {
  if (!emailConfigured) throw new Error('EmailJS 키가 설정되지 않았어요')
  await emailjs.send(
    SERVICE_ID!,
    TEMPLATE_ID!,
    {
      from_name: name,
      reply_to: email,
      message,
      sent_at: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      page_url: window.location.href,
    },
    { publicKey: PUBLIC_KEY! },
  )
}
