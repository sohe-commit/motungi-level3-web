"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, setToken, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();
  const [memberType, setMemberType] = useState<"INDIVIDUAL" | "COMPANY">("INDIVIDUAL");
  const [form, setForm] = useState({ email: "", password: "", name: "", companyName: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ accessToken: string }>("/auth/customer/signup", {
        method: "POST",
        body: JSON.stringify({ ...form, memberType }),
      });
      setToken(res.accessToken);
      router.push("/welcome");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen w-full place-items-center px-4 py-10">
      {/* 너비는 항상 max-w-sm으로 고정 — 개인/법인 전환 시 세로 길이만 바뀌고 가로는 고정된다 */}
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="text-2xl font-bold text-neutral">모퉁이 회원가입</h1>

        <div className="flex w-full gap-2">
          {(["INDIVIDUAL", "COMPANY"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMemberType(type)}
              className={`h-10 flex-1 rounded-full text-sm font-bold ${
                memberType === type ? "bg-neutral text-white" : "bg-neutral-weak text-neutral-sub"
              }`}
            >
              {type === "INDIVIDUAL" ? "개인 계정" : "법인 계정"}
            </button>
          ))}
        </div>
        {memberType === "COMPANY" && (
          <p className="text-xs text-neutral-sub">
            가입하면 자동으로 이 법인의 최고관리자가 되며, 이후 소속 인원을 추가할 수 있습니다.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          {memberType === "COMPANY" && (
            <Input
              placeholder="법인명"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              autoComplete="organization"
              required
            />
          )}
          <Input
            placeholder="이름"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoComplete="name"
            required
          />
          <Input
            type="email"
            placeholder="이메일"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
            required
          />
          <Input
            type="password"
            placeholder="비밀번호 (8자 이상)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            autoComplete="new-password"
            required
          />
          {error && <p className="text-sm text-accent">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "가입 중..." : "가입하기"}
          </Button>
        </form>
        <p className="text-center text-sm text-neutral-sub">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-bold text-primary">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
