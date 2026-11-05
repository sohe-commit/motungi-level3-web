"use client";

export function SuccessBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="mb-6 flex items-center justify-between rounded-xl bg-primary-weak px-4 py-3 text-sm font-bold text-primary">
      <span>{message}</span>
      <button onClick={onDismiss} className="text-xs font-normal hover:underline" aria-label="닫기">
        닫기
      </button>
    </div>
  );
}
