"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, clearToken } from "@/lib/api";

const links = [
  { href: "/", label: "홈" },
  { href: "/reservations", label: "회의실" },
  { href: "/membership/overview", label: "멤버십" },
  { href: "/facility/report/new", label: "고장 제보" },
];

interface Me {
  name: string;
  email: string;
  type: "INDIVIDUAL" | "COMPANY";
  companyName: string | null;
  role: "SUPER_ADMIN" | "PERMISSION_ADMIN" | "MEMBER_USER";
}

const companyRoleLabel: Record<Me["role"], string> = {
  SUPER_ADMIN: "최고관리자",
  PERMISSION_ADMIN: "권한관리자",
  MEMBER_USER: "소속 인원",
};

function accountLabel(me: Me) {
  if (me.type === "INDIVIDUAL") return "개인 회원";
  return `${companyRoleLabel[me.role]} · ${me.companyName}`;
}

export function TopNav() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    apiFetch<Me>("/me").then(setMe).catch(() => setMe(null));
  }, []);

  const allLinks =
    me?.type === "COMPANY" && me.role !== "MEMBER_USER"
      ? [...links, { href: "/company/members", label: "소속 인원 관리" }]
      : links;

  return (
    <nav className="flex h-16 items-center justify-between border-b border-neutral-weak2 px-6">
      <div className="flex items-center gap-6">
        <span className="text-lg font-bold text-primary">모퉁이</span>
        {allLinks.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm text-neutral-sub hover:text-neutral">
            {l.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-4">
        {me && (
          <div className="text-right leading-tight">
            <p className="text-sm font-bold text-neutral">{me.name}</p>
            <p className="text-xs text-neutral-sub">{accountLabel(me)}</p>
          </div>
        )}
        <button
          onClick={() => {
            clearToken();
            router.push("/login");
          }}
          className="text-sm text-neutral-sub hover:text-neutral"
        >
          로그아웃
        </button>
      </div>
    </nav>
  );
}
