"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiFetch } from "@/lib/api";
import { fmtDate, fmtDateTime, fmtTime } from "@/lib/format";
import { TopNav } from "@/components/TopNav";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

interface QuotaSummary {
  membershipType: string;
  cycleStart: string;
  cycleEnd: string;
  baseLimitHours: number;
  overageAllowedHours: number;
  totalAllowedHours: number;
  usedHours: number;
  remainingHours: number;
}
interface MyReservation {
  id: string;
  startAt: string;
  endAt: string;
  timeline: string;
  room: { name: string };
}
interface Me {
  type: "INDIVIDUAL" | "COMPANY";
  companyName: string | null;
}
interface CompanyUsageItem {
  accountId: string;
  accountName: string;
  hours: number;
}
interface Billing {
  membershipFee: number;
  overageHours: number;
  overageCharge: number;
  totalCharge: number;
}
interface SpaceAssignment {
  spaceType: "SEAT" | "OFFICE";
  spaceNumber: string;
  endDate: string;
}

type Loadable<T> = { status: "loading" } | { status: "none" } | { status: "ok"; data: T };

function won(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}
function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const ready = useRequireAuth();
  const [me, setMe] = useState<Loadable<Me>>({ status: "loading" });
  const [quota, setQuota] = useState<Loadable<QuotaSummary>>({ status: "loading" });
  const [reservations, setReservations] = useState<Loadable<MyReservation[]>>({ status: "loading" });
  const [companyUsage, setCompanyUsage] = useState<Loadable<CompanyUsageItem[]>>({ status: "loading" });
  const [billing, setBilling] = useState<Loadable<Billing>>({ status: "loading" });
  const [space, setSpace] = useState<Loadable<SpaceAssignment>>({ status: "loading" });

  useEffect(() => {
    if (!ready) return;

    apiFetch<Me>("/me")
      .then((data) => setMe({ status: "ok", data }))
      .catch(() => setMe({ status: "none" }));

    apiFetch<QuotaSummary>("/membership/overview")
      .then((data) => setQuota({ status: "ok", data }))
      .catch(() => setQuota({ status: "none" }));

    apiFetch<MyReservation[]>("/reservations/mine")
      .then((list) => {
        const upcoming = list.filter((x) => x.timeline === "upcoming" || x.timeline === "ongoing");
        setReservations({ status: "ok", data: upcoming });
      })
      .catch(() => setReservations({ status: "none" }));

    apiFetch<Billing>("/membership/billing")
      .then((data) => setBilling({ status: "ok", data }))
      .catch(() => setBilling({ status: "none" }));

    apiFetch<SpaceAssignment | null>("/membership/my-space")
      .then((data) => setSpace(data ? { status: "ok", data } : { status: "none" }))
      .catch(() => setSpace({ status: "none" }));
  }, [ready]);

  useEffect(() => {
    if (!ready || me.status !== "ok" || me.data.type !== "COMPANY") return;
    apiFetch<CompanyUsageItem[]>("/membership/company-usage")
      .then((data) => setCompanyUsage({ status: "ok", data }))
      .catch(() => setCompanyUsage({ status: "none" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, me.status]);

  if (!ready) return null;

  const expiringSoon =
    quota.status === "ok" && daysUntil(quota.data.cycleEnd) <= 7 ? quota.data.cycleEnd : null;

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold text-neutral">대시보드</h1>

        {/* 1. 빠른 액션 — 주요 기능에 바로 접근 */}
        <div className="mb-8 flex gap-3">
          <Link href="/reservations" className="flex-1">
            <Button className="w-full">회의실 예약하기</Button>
          </Link>
          <Link href="/facility/report/new" className="flex-1">
            <Button variant="secondary" className="w-full">
              고장 제보
            </Button>
          </Link>
        </div>

        {/* 2. 멤버십 카드 */}
        <section className="mb-6 rounded-2xl border border-neutral-weak3 p-6">
          {quota.status === "loading" && <p className="text-sm text-neutral-sub">불러오는 중...</p>}
          {quota.status === "none" && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="mb-1 text-sm font-bold text-neutral-sub">멤버십</h2>
                <p className="text-sm text-accent">현재 유효한 멤버십이 없습니다.</p>
              </div>
              <Link href="/membership/subscribe">
                <Button>멤버십 구독하기</Button>
              </Link>
            </div>
          )}
          {quota.status === "ok" && (
            <>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-sm font-bold text-neutral-sub">{quota.data.membershipType} 멤버십</h2>
                {expiringSoon && (
                  <span className="rounded-full bg-warning-weak px-2 py-0.5 text-xs font-bold text-warning">
                    {fmtDate(expiringSoon)} 종료 예정
                  </span>
                )}
              </div>
              <p className="mb-4 text-xs text-neutral-sub">
                결제 주기 {fmtDate(quota.data.cycleStart)} ~ {fmtDate(quota.data.cycleEnd)}
              </p>
              <p className="mb-1 text-xs font-bold text-neutral-sub">회의실 이용 시간</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-primary">
                  {quota.data.remainingHours.toFixed(1)}
                </span>
                <span className="text-sm text-neutral-sub">
                  / {quota.data.totalAllowedHours}시간 남음 (기본 {quota.data.baseLimitHours}시간 +
                  초과허용 {quota.data.overageAllowedHours}시간)
                </span>
              </div>
            </>
          )}
        </section>

        {/* 3. 다가오는 예약 — 멤버십 카드와 동일한 틀을 항상 유지 */}
        <section className="mb-6 rounded-2xl border border-neutral-weak3 p-6">
          <h2 className="mb-3 text-sm font-bold text-neutral-sub">다가오는 예약</h2>
          {reservations.status === "loading" && (
            <p className="text-sm text-neutral-sub">불러오는 중...</p>
          )}
          {reservations.status === "none" && (
            <p className="text-sm text-neutral-sub">다가오는 예약이 없습니다.</p>
          )}
          {reservations.status === "ok" && (
            <>
              {reservations.data.length === 0 ? (
                <p className="text-sm text-neutral-sub">다가오는 예약이 없습니다.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {reservations.data.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-weak2 p-4"
                    >
                      <div>
                        <p className="font-bold text-neutral">{r.room.name}</p>
                        <p className="text-xs text-neutral-sub">
                          {fmtDateTime(r.startAt)} ~ {fmtTime(r.endAt)}
                        </p>
                      </div>
                      <StatusBadge status={r.timeline} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        {/* 4. [법인 전용] 소속 인원 이용 현황 */}
        {me.status === "ok" && me.data.type === "COMPANY" && (
          <section className="mb-6 rounded-2xl border border-neutral-weak3 p-6">
            <h2 className="mb-3 text-sm font-bold text-neutral-sub">
              {me.data.companyName} — 이번 달 소속 인원 이용 현황
            </h2>
            {companyUsage.status !== "ok" && (
              <p className="text-sm text-neutral-sub">불러오는 중...</p>
            )}
            {companyUsage.status === "ok" && companyUsage.data.length === 0 && (
              <p className="text-sm text-neutral-sub">이번 달 이용 내역이 없습니다.</p>
            )}
            {companyUsage.status === "ok" && companyUsage.data.length > 0 && (
              <ul className="flex flex-col gap-2">
                {companyUsage.data
                  .sort((a, b) => b.hours - a.hours)
                  .map((item) => (
                    <li key={item.accountId} className="flex justify-between text-sm">
                      <span className="text-neutral">{item.accountName}</span>
                      <span className="font-bold text-neutral-sub">{item.hours.toFixed(1)}시간</span>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        )}

        <div className="mb-6 grid grid-cols-2 gap-4">
          {/* 5. 예상 청구액 */}
          <section className="rounded-2xl border border-neutral-weak3 p-6">
            <h2 className="mb-2 text-sm font-bold text-neutral-sub">이번 주기 예상 청구액</h2>
            {billing.status === "ok" ? (
              <>
                <p className="mb-2 text-2xl font-bold text-primary">{won(billing.data.totalCharge)}</p>
                <Link href="/membership/overview" className="text-xs font-bold text-neutral-sub">
                  자세히 보기 →
                </Link>
              </>
            ) : (
              <p className="text-sm text-neutral-sub">
                {billing.status === "loading" ? "불러오는 중..." : "멤버십 구독 후 표시됩니다."}
              </p>
            )}
          </section>

          {/* 6. [고정석/오피스 전용] 내 전용 공간 */}
          {space.status === "ok" && (
            <section className="rounded-2xl border border-neutral-weak3 p-6">
              <h2 className="mb-2 text-sm font-bold text-neutral-sub">
                {space.data.spaceType === "OFFICE" ? "내 오피스" : "내 고정석"}
              </h2>
              <p className="mb-2 text-2xl font-bold text-primary">{space.data.spaceNumber}</p>
              <p className="text-xs text-neutral-sub">{fmtDate(space.data.endDate)}까지 배정</p>
            </section>
          )}
          {space.status === "none" &&
            quota.status === "ok" &&
            (quota.data.membershipType === "고정석" || quota.data.membershipType === "오피스") && (
              <section className="rounded-2xl border border-neutral-weak3 p-6">
                <h2 className="mb-2 text-sm font-bold text-neutral-sub">
                  아직 배정된 {quota.data.membershipType === "오피스" ? "오피스" : "고정석"}가 없어요
                </h2>
                <Link href="/membership/space">
                  <Button className="w-full">건물 구조도에서 자리 선택하기</Button>
                </Link>
              </section>
            )}
        </div>
      </main>
    </div>
  );
}
