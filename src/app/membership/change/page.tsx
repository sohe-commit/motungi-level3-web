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
interface QuotaSummary {
  membershipType: string;
  baseLimitHours: number;
}

function won(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function ChangeMembershipPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [types, setTypes] = useState<MembershipType[]>([]);
  const [current, setCurrent] = useState<QuotaSummary | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    apiFetch<MembershipType[]>("/membership/types").then(setTypes);
    apiFetch<QuotaSummary>("/membership/overview")
      .then(setCurrent)
      .catch(() => setCurrent(null));
  }, [ready]);

  const selectedType = types.find((t) => t.id === selected);
  const isUpgrade =
    current && selectedType ? selectedType.monthlyUsageHours >= current.baseLimitHours : null;

  async function submit() {
    if (!selected) return;
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/membership/change", {
        method: "PATCH",
        body: JSON.stringify({ membershipTypeId: selected }),
      });
      setFlash(
        isUpgrade
          ? `${selectedType?.name} 멤버십으로 즉시 변경되었습니다.`
          : `${selectedType?.name} 멤버십으로 변경 예약되었습니다. 다음 결제 주기부터 적용됩니다.`,
      );
      router.push("/membership/overview");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-2 text-2xl font-bold text-neutral">멤버십 변경</h1>
        <p className="mb-6 text-sm text-neutral-sub">
          현재 멤버십: <span className="font-bold text-neutral">{current?.membershipType ?? "-"}</span>
        </p>

        <div className="mb-4 flex flex-col gap-3">
          {types.map((t) => {
            const isCurrent = t.name === current?.membershipType;
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                disabled={isCurrent}
                className={`flex items-center justify-between rounded-2xl border p-5 text-left transition-colors ${
                  selected === t.id
                    ? "border-primary bg-primary-weak"
                    : isCurrent
                      ? "cursor-not-allowed border-neutral-weak2 opacity-50"
                      : "border-neutral-weak3 hover:bg-neutral-weak"
                }`}
              >
                <div>
                  <p className="font-bold text-neutral">
                    {t.name} {isCurrent && "(현재 이용 중)"}
                  </p>
                  <p className="text-xs text-neutral-sub">월 {t.monthlyUsageHours}시간 제공</p>
                </div>
                <p className="font-bold text-primary">{won(t.monthlyFee)} / 월</p>
              </button>
            );
          })}
          {types.length === 0 && <p className="text-sm text-neutral-sub">불러오는 중...</p>}
        </div>

        {isUpgrade !== null && (
          <p className="mb-4 text-xs text-neutral-sub">
            {isUpgrade
              ? "업그레이드는 지금 바로 적용됩니다. 이번 주기에 이미 쓴 시간은 그대로 유지돼요."
              : "다운그레이드는 지금 결제 주기가 끝난 다음 주기부터 적용됩니다. 이번 주기는 현재 멤버십대로 유지돼요."}
          </p>
        )}

        {error && <p className="mb-4 text-sm text-accent">{error}</p>}
        <Button onClick={submit} disabled={!selected || loading}>
          {loading ? "변경 처리 중..." : "이 요금제로 변경하기"}
        </Button>
      </main>
    </div>
  );
}
