/** Preserve server error messages; use the host SDK so authentication stays host-owned. */
export function message(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return '요청을 완료하지 못했습니다. 다시 확인해 주세요.';
}
