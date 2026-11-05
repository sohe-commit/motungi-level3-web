"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiFetch } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { TopNav } from "@/components/TopNav";
import { FlashBanner } from "@/components/FlashBanner";

interface IssueReport {
  id: string;
  content: string;
  status: "RECEIVED" | "IN_PROGRESS" | "COMPLETED";
  reportedAt: string;
  room: { name: string };
}

const statusLabel: Record<IssueReport["status"], string> = {
  RECEIVED: "접수",
  IN_PROGRESS: "처리중",
  COMPLETED: "완료",
};
const statusStyle: Record<IssueReport["status"], string> = {
  RECEIVED: "bg-neutral-weak text-neutral-sub",
  IN_PROGRESS: "bg-primary-weak text-primary",
  COMPLETED: "bg-neutral-weak1 text-neutral-sub",
};

export default function MyIssueReportsPage() {
  const ready = useRequireAuth();
  const [reports, setReports] = useState<IssueReport[]>([]);

  useEffect(() => {
    if (!ready) return;
    apiFetch<IssueReport[]>("/facility/reports/mine").then(setReports);
  }, [ready]);

  if (!ready) return null;

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold text-neutral">내 제보 내역</h1>
        <FlashBanner />

        <ul className="flex flex-col gap-2">
          {reports.map((r) => (
            <li key={r.id} className="rounded-xl border border-neutral-weak2 p-4">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-bold text-neutral">{r.room.name}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle[r.status]}`}>
                  {statusLabel[r.status]}
                </span>
              </div>
              <p className="mb-1 text-sm text-neutral">{r.content}</p>
              <p className="text-xs text-neutral-sub">{fmtDateTime(r.reportedAt)}</p>
            </li>
          ))}
          {reports.length === 0 && <p className="text-sm text-neutral-sub">제보 내역이 없습니다.</p>}
        </ul>
      </main>
    </div>
  );
}
