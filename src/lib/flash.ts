const KEY = "motungi_flash";

// 다른 페이지로 이동한 뒤 완료 메시지를 보여주기 위한 1회성 저장소(세션 스토리지 기반)
export function setFlash(message: string) {
  if (typeof window !== "undefined") sessionStorage.setItem(KEY, message);
}

export function consumeFlash(): string | null {
  if (typeof window === "undefined") return null;
  const msg = sessionStorage.getItem(KEY);
  if (msg) sessionStorage.removeItem(KEY);
  return msg;
}
