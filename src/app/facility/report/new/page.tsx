"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiFetch } from "@/lib/api";
import { setFlash } from "@/lib/flash";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/Button";

interface Room {
  id: string;
  name: string;
}

export default function NewIssueReportPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!ready) return;
    apiFetch<Room[]>("/rooms").then((list) => {
      setRooms(list);
      if (list.length > 0) setRoomId(list[0].id);
    });
  }, [ready]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch("/facility/reports", { method: "POST", body: JSON.stringify({ roomId, content }) });
    setFlash("제보가 접수되었습니다. 확인 후 조치하겠습니다.");
    router.push("/facility/report/mine");
  }

  if (!ready) return null;

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral">회의실 고장 제보</h1>
          <Link href="/facility/report/mine" className="text-xs font-bold text-primary hover:underline">
            내 제보 내역
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-weak3 px-4 text-sm"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="어떤 문제가 있었는지 적어주세요."
            className="h-32 rounded-xl border border-neutral-weak3 p-4 text-sm outline-none focus:border-primary"
            required
          />
          <Button type="submit">제보하기</Button>
        </form>
      </main>
    </div>
  );
}
