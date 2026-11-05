// 날짜/시간 표기를 앱 전체에서 통일하기 위한 공통 포맷터
// 날짜: "2026. 11. 6." / 시간: "오전 10:00" (초 없음) / 날짜+시간: "2026. 11. 6. 오전 10:00"
export function fmtDate(iso: string | Date) {
  return new Date(iso).toLocaleDateString("ko-KR");
}

export function fmtTime(iso: string | Date) {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDateTime(iso: string | Date) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
