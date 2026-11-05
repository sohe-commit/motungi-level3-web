const styles: Record<string, string> = {
  upcoming: "bg-primary-weak text-primary",
  ongoing: "bg-primary text-white",
  past: "bg-neutral-weak text-neutral-sub",
  cancelled: "bg-neutral-weak1 text-neutral-sub line-through",
};

const labels: Record<string, string> = {
  upcoming: "다가올 예약",
  ongoing: "사용중",
  past: "지난 예약",
  cancelled: "취소",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status] ?? styles.past}`}>
      {labels[status] ?? status}
    </span>
  );
}
