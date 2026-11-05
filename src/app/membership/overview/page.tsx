"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiFetch } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { TopNav } from "@/components/TopNav";
import { FlashBanner } from "@/components/FlashBanner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface QuotaSummary {
  membershipType: string;
  cycleStart: string;
  cycleEnd: string;
  baseLimitHours: number;
  overageAllowedHours: number;
  totalAllowedHours: number;
  usedHours: number;
  overageUsedHours: number;
  remainingHours: number;
}
interface Billing {
  membershipFee: number;
  overageHours: number;
  overageCharge: number;
  totalCharge: number;
}

function won(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

type QuotaState = { status: "loading" } | { status: "none" } | { status: "ok"; data: QuotaSummary };
type BillingState = { status: "loading" } | { status: "none" } | { status: "ok"; data: Billing };

export default function MembershipOverviewPage() {
  const ready = useRequireAuth();
  const [quota, setQuota] = useState<QuotaState>({ status: "loading" });
  const [billing, setBilling] = useState<BillingState>({ status: "loading" });
  const [overageInput, setOverageInput] = useState(0);
  const [saved, setSaved] = useState(false);

  function load() {
    apiFetch<QuotaSummary>("/membership/overview")
      .then((q) => {
        setQuota({ status: "ok", data: q });
        setOverageInput(q.overageAllowedHours);
      })
      .catch(() => setQuota({ status: "none" }));
    apiFetch<Billing>("/membership/billing")
      .then((b) => setBilling({ status: "ok", data: b }))
      .catch(() => setBilling({ status: "none" }));
  }

  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function saveOverage() {
    await apiFetch("/membership/overage", {
      method: "PATCH",
      body: JSON.stringify({ overageAllowedHours: overageInput }),
    });
    setSaved(true);
    load();
  }

  if (!ready) return null;

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold text-neutral">멤버십</h1>
        <FlashBanner />

        <section className="mb-6 rounded-2xl border border-neutral-weak3 p-6">
          {quota.status === "loading" && <p className="text-sm text-neutral-sub">불러오는 중...</p>}
          {quota.status === "none" && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-accent">현재 유효한 멤버십이 없습니다.</p>
              <Link href="/membership/subscribe">
                <Button>멤버십 구독하기</Button>
              </Link>
            </div>
          )}
          {quota.status === "ok" && (
            <>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-sm font-bold text-neutral-sub">{quota.data.membershipType}</h2>
                <Link href="/membership/change" className="text-xs font-bold text-primary hover:underline">
                  멤버십 변경
                </Link>
              </div>
              <p className="mb-4 text-xs text-neutral-sub">
                결제 주기 {fmtDate(quota.data.cycleStart)} ~ {fmtDate(quota.data.cycleEnd)}
              </p>
              <h3 className="mb-2 text-xs font-bold text-neutral-sub">
                회의실 이용 시간 <span className="font-normal">(공간 이용과는 별도예요)</span>
              </h3>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-neutral-sub">기본 제공</dt>
                <dd className="text-right font-bold">{quota.data.baseLimitHours}시간</dd>
                <dt className="text-neutral-sub">초과 허용</dt>
                <dd className="text-right font-bold">{quota.data.overageAllowedHours}시간</dd>
                <dt className="text-neutral-sub">이번 주기 사용</dt>
                <dd className="text-right font-bold">{quota.data.usedHours.toFixed(1)}시간</dd>
                <dt className="text-neutral-sub">잔여</dt>
                <dd className="text-right font-bold text-primary">
                  {quota.data.remainingHours.toFixed(1)}시간
                </dd>
              </dl>
            </>
          )}
        </section>

        <section className="mb-6 rounded-2xl border border-neutral-weak3 p-6">
          <h2 className="mb-3 text-sm font-bold text-neutral-sub">초과허용시간 설정</h2>
          <p className="mb-3 text-xs text-neutral-sub">
            기본 제공 시간을 다 쓰더라도, 여기서 설정한 만큼은 즉시 더 예약할 수 있습니다. 초과분은
            시간당 15,000원으로 다음 결제에 합산 청구됩니다.
          </p>
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              value={overageInput}
              onChange={(e) => setOverageInput(Number(e.target.value))}
            />
            <Button onClick={saveOverage}>저장</Button>
          </div>
          {saved && <p className="mt-2 text-xs text-primary">저장되었습니다.</p>}
        </section>

        <section className="rounded-2xl border border-neutral-weak3 p-6">
          <h2 className="mb-3 text-sm font-bold text-neutral-sub">이번 결제 주기 예상 청구액</h2>
          {billing.status === "loading" && <p className="text-sm text-neutral-sub">불러오는 중...</p>}
          {billing.status === "none" && (
            <p className="text-sm text-neutral-sub">멤버십을 구독하면 예상 청구액이 표시됩니다.</p>
          )}
          {billing.status === "ok" && (
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-neutral-sub">멤버십 요금</dt>
              <dd className="text-right">{won(billing.data.membershipFee)}</dd>
              <dt className="text-neutral-sub">
                초과 시간 ({billing.data.overageHours.toFixed(1)}시간)
              </dt>
              <dd className="text-right">{won(billing.data.overageCharge)}</dd>
              <dt className="font-bold text-neutral">합계</dt>
              <dd className="text-right text-lg font-bold text-primary">
                {won(billing.data.totalCharge)}
              </dd>
            </dl>
          )}
        </section>
      </main>
    </div>
  );
}
