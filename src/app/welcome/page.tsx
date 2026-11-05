"use client";

import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { Button } from "@/components/ui/Button";

// 가입 직후 안내 — 바로 구독할지 나중에 할지 선택 (업계 통상 온보딩 패턴)
export default function WelcomePage() {
  const ready = useRequireAuth();
  if (!ready) return null;

  return (
    <div className="grid min-h-screen w-full place-items-center px-4">
      <div className="flex w-full max-w-sm flex-col gap-6 text-center">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-neutral">가입이 완료되었습니다</h1>
          <p className="text-sm text-neutral-sub">
            지금 멤버십을 구독하고 바로 회의실을 예약할 수 있어요. 나중에 둘러봐도 괜찮아요.
          </p>
        </div>
        <Link href="/membership/subscribe" className="w-full">
          <Button className="w-full">멤버십 구독하러 가기</Button>
        </Link>
        <Link href="/" className="text-sm font-bold text-neutral-sub hover:text-neutral">
          나중에 할게요, 대시보드로 이동
        </Link>
      </div>
    </div>
  );
}
