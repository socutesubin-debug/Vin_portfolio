/**
 * CONTACT 장면 설정: 받는 이메일, 카드 문구, 전화 울림, 수화기 위치.
 * 문구·주소는 이 파일만 고치면 된다.
 */

export const CONTACT = {
  /** 이메일 복사 버튼과 "메일 앱으로 직접 보내기"에 쓰는 주소(EmailJS 수신 주소는 EmailJS 설정에서 정한다) */
  email: 'socutesubin@gmail.com',
  /** 메일 앱으로 보낼 때 제목 */
  mailSubject: '[VIN 포트폴리오] 부재중 메시지',
  copy: {
    title: '부재중 메시지 남기기',
    lead: 'VIN은 잠시 자리를 비웠어요. 메시지를 남겨주시면 돌아와서 연락드릴게요.',
    success: '메시지를 남겼어요. VIN이 돌아오면 확인할게요.',
    failure: '전송에 실패했어요. 다시 시도해주세요.',
    notConfigured: '지금은 이 카드로 바로 보낼 수 없어요. 아래 "메일 앱으로 직접 보내기"를 이용해 주세요.',
    cooldown: '방금 메시지를 보냈어요. 잠시 후 다시 보내 주세요.',
  },
  /** 같은 브라우저에서 연달아 보내지 못하게 막는 시간(초) */
  resendCooldown: 30,
  /** 성공 문구를 보여 준 뒤 수화기를 내려놓기까지(ms) */
  successHold: 2200,
}

/**
 * 전화 울림: CONTACT에 도착하면 period초 간격으로 cycles번 "따르릉"(짧은 울림 두 번).
 * bursts는 한 주기 안에서 울리는 구간[시작, 끝](초).
 */
export const RING = {
  cycles: 3,
  period: 2.2,
  bursts: [
    [0, 0.42],
    [0.6, 1.02],
  ] as [number, number][],
}

/** ringAt(울림 시작 시각)부터 t초 지났을 때 지금 울리는 중인지 */
export function isRinging(t: number) {
  if (t < 0 || t >= RING.cycles * RING.period) return false
  const local = t % RING.period
  return RING.bursts.some(([a, b]) => local >= a && local < b)
}

/**
 * 받은 수화기가 놓이는 화면 위치(카메라 기준).
 * x·y는 화면 절반 크기 대비 비율(-1~1), distance는 카메라에서의 거리(m).
 * 가로 화면은 오른쪽(왼쪽에 카드), 세로 화면은 위쪽(아래에서 카드가 올라온다).
 */
export const HANDSET_POSE = {
  wide: { x: 0.5, y: -0.02, distance: 0.85, tilt: [0.45, -0.35, -0.95] as [number, number, number] },
  narrow: { x: 0.1, y: 0.5, distance: 0.95, tilt: [0.45, -0.2, -0.35] as [number, number, number] },
  /** 이 비율(가로/세로)보다 좁으면 narrow */
  narrowBelow: 0.85,
}
