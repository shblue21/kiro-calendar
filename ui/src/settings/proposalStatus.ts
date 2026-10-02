/** Registration and the outcome of the last execution are separate facts. */
export function hookExecutionNotice(status?: string): { text: string; failure: boolean } | null {
  switch (status) {
    case "ok": return null;
    case "not_run": return { text: "연결은 등록됐어요. 실제 대화에서의 실행은 아직 확인하지 않았어요.", failure: false };
    case "timeout": return { text: "최근 연결 실행이 시간 초과됐어요. Crew 훅 기록을 확인해 주세요.", failure: true };
    case "blocked": return { text: "최근 연결 실행이 정책에 의해 차단됐어요. Crew 훅 기록을 확인해 주세요.", failure: true };
    case "error": return { text: "최근 연결 실행에 실패했어요. Crew 훅 기록을 확인해 주세요.", failure: true };
    default: return { text: "연결은 등록됐지만 최근 실행 상태를 확인하지 못했어요.", failure: false };
  }
}
