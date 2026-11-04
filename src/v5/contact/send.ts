/**
 * 메시지 전송. V2의 EmailJS 경로(src/v2/lib/sendMessage.ts)를 재사용한다.
 * 키(.env.local의 VITE_EMAILJS_*)가 없으면 보내지 않고 'not-configured'를 돌려준다 → 화면에 '전송 서비스 미연결'로 표시.
 * 서비스가 접수했을 때만 'sent'.
 */
export type SendResult = 'sent' | 'not-configured' | 'failed'

export interface MessageInput {
  name: string
  email: string
  message: string
}

export async function sendMessage(input: MessageInput): Promise<SendResult> {
  // EmailJS는 제출할 때만 불러온다
  const mod = await import('../../v2/lib/sendMessage')
  if (!mod.emailConfigured) {
    await new Promise((r) => setTimeout(r, 350)) // 중복 제출 방지 상태가 보이도록 짧게
    return 'not-configured'
  }
  try {
    await mod.sendMessage({ ...input, name: input.name || '(이름·소속 없음)' })
    return 'sent'
  } catch (err) {
    console.error('[Contact] 전송 실패', err)
    return 'failed'
  }
}
