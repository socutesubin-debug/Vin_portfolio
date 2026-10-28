// 전화벨 오디오 확장 지점. 기본값은 완전한 무음이며 아무 것도 재생하지 않는다.
// 나중에 소리를 넣을 때는 이 객체를 교체/확장한다(예: 사용자 제스처 이후에만 재생, 음소거 토글 제공).
// TelephoneObject가 통화 상태 전이(ringing 시작/종료)에 맞춰 호출한다.

export type CallAudio = {
  enabled: boolean
  startRing: () => void
  stopRing: () => void
}

export const callAudio: CallAudio = {
  enabled: false,
  startRing() {},
  stopRing() {},
}
