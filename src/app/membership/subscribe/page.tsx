"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiFetch, ApiError } from "@/lib/api";
import { setFlash } from "@/lib/flash";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/Button";

interface MembershipType {
  id: string;
  name: string;
  monthlyFee: number;
  monthlyUsageHours: number;
}

function won(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function SubscribeMembershipPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [types, setTypes] = useState<MembershipType[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    apiFetch<MembershipType[]>("/membership/types").then(setTypes);
  }, [ready]);

  async function subscribe() {
    if (!selected) return;
    setError(null);
    setLoading(true);
    try {
      const type = types.find((t) => t.id === selected);
      await apiFetch("/membership/subscribe", {
        method: "POST",
        body: JSON.stringify({ membershipTypeId: selected }),
      });
      setFlash(`${type?.name ?? "멤버십"} 구독이 완료되었습니다.`);
      router.push("/membership/overview");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "구독에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-2 text-2xl font-bold text-neutral">멤버십 선택</h1>
        <p className="mb-6 text-sm text-neutral-sub">
          요금제를 선택하면 오늘부터 한 달간 적용됩니다.
        </p>

        <div className="mb-6 flex flex-col gap-3">
          {types.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={`flex items-center justify-between rounded-2xl border p-5 text-left transition-colors ${
                selected === t.id
                  ? "border-primary bg-primary-weak"
                  : "border-neutral-weak3 hover:bg-neutral-weak"
              }`}
            >
              <div>
                <p className="font-bold text-neutral">{t.name}</p>
                <p className="text-xs text-neutral-sub">월 {t.monthlyUsageHours}시간 제공</p>
              </div>
              <p className="font-bold text-primary">{won(t.monthlyFee)} / 월</p>
            </button>
          ))}
          {types.length === 0 && <p className="text-sm text-neutral-sub">불러오는 중...</p>}
        </div>

        {error && <p className="mb-4 text-sm text-accent">{error}</p>}
        <Button onClick={subscribe} disabled={!selected || loading}>
          {loading ? "구독 처리 중..." : "이 요금제로 구독하기"}
        </Button>
      </main>
    </div>
  );
}
