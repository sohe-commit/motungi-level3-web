"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiFetch, ApiError, clearToken } from "@/lib/api";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface RefundPreview {
  daysUsed: number;
  refundType: "FULL" | "PRORATED";
  refundAmount: number;
}

function won(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

type CompanyRole = "SUPER_ADMIN" | "PERMISSION_ADMIN" | "MEMBER_USER";

interface CompanyMember {
  id: string;
  email: string;
  name: string;
  role: CompanyRole;
  status: "ACTIVE" | "INACTIVE";
}
interface Me {
  type: "INDIVIDUAL" | "COMPANY";
  companyName: string | null;
  role: CompanyRole;
}

const roleLabel: Record<CompanyRole, string> = {
  SUPER_ADMIN: "최고관리자",
  PERMISSION_ADMIN: "권한관리자",
  MEMBER_USER: "일반사용자",
};

// 최고관리자는 모든 대상 관리 가능. 권한관리자는 일반사용자만 관리 가능(다른 권한관리자·최고관리자는 불가)
function canManage(actorRole: CompanyRole, targetRole: CompanyRole) {
  if (actorRole === "SUPER_ADMIN") return true;
  if (actorRole === "PERMISSION_ADMIN") return targetRole === "MEMBER_USER";
  return false;
}

export default function CompanyMembersPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refundPreview, setRefundPreview] = useState<RefundPreview | null>(null);
  const [terminating, setTerminating] = useState(false);

  function load() {
    apiFetch<CompanyMember[]>("/company/members").then(setMembers).catch(() => setMembers([]));
  }

  useEffect(() => {
    if (!ready) return;
    apiFetch<Me>("/me")
      .then((data) => {
        setMe(data);
        if (data.type === "COMPANY" && data.role !== "MEMBER_USER") load();
      })
      .catch(() => setMe(null));
  }, [ready]);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/company/members", { method: "POST", body: JSON.stringify(form) });
      setForm({ email: "", name: "", password: "" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "추가에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleRole(m: CompanyMember) {
    const nextRole = m.role === "PERMISSION_ADMIN" ? "MEMBER_USER" : "PERMISSION_ADMIN";
    await apiFetch(`/company/members/${m.id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role: nextRole }),
    });
    load();
  }

  async function deactivate(m: CompanyMember) {
    if (!confirm(`${m.name}님을 퇴사 처리할까요? 향후 예약이 모두 취소됩니다.`)) return;
    await apiFetch(`/company/members/${m.id}/deactivate`, { method: "PATCH" });
    load();
  }

  async function previewRefund() {
    try {
      const preview = await apiFetch<RefundPreview>("/membership/refund-preview");
      setRefundPreview(preview);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "환불 금액을 계산할 수 없습니다.");
    }
  }

  async function terminateCompany() {
    if (!confirm("정말 법인 멤버십을 해지할까요? 소속 인원 전체 로그인이 차단되고 되돌릴 수 없습니다.")) {
      return;
    }
    setTerminating(true);
    try {
      await apiFetch("/company/terminate", { method: "POST" });
      clearToken();
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "해지에 실패했습니다.");
      setTerminating(false);
    }
  }

  if (!ready) return null;

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold text-neutral">소속 인원 관리</h1>

        {!me && <p className="text-sm text-neutral-sub">불러오는 중...</p>}

        {me && me.type !== "COMPANY" && (
          <p className="text-sm text-neutral-sub">법인 멤버 전용 화면입니다.</p>
        )}

        {me && me.type === "COMPANY" && me.role === "MEMBER_USER" && (
          <p className="text-sm text-neutral-sub">
            소속 인원 추가·관리는 {me.companyName}의 최고관리자·권한관리자만 할 수 있습니다.
          </p>
        )}

        {me && me.type === "COMPANY" && me.role !== "MEMBER_USER" && (
          <>
            <table className="mb-10 w-full text-left text-sm">
              <thead className="border-b border-neutral-weak2 text-neutral-sub">
                <tr>
                  <th className="py-2">이름</th>
                  <th>이메일</th>
                  <th>역할</th>
                  <th>상태</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-neutral-weak1">
                    <td className="py-2">{m.name}</td>
                    <td className="text-neutral-sub">{m.email}</td>
                    <td>{roleLabel[m.role]}</td>
                    <td>{m.status === "ACTIVE" ? "재직" : "퇴사"}</td>
                    <td className="flex gap-2 py-2">
                      {m.status === "ACTIVE" && m.role !== "SUPER_ADMIN" && (
                        <>
                          {me?.role === "SUPER_ADMIN" && (
                            <Button variant="secondary" onClick={() => toggleRole(m)}>
                              {m.role === "PERMISSION_ADMIN" ? "일반사용자로 변경" : "권한관리자로 지정"}
                            </Button>
                          )}
                          {me && canManage(me.role, m.role) && (
                            <Button variant="danger" onClick={() => deactivate(m)}>
                              퇴사 처리
                            </Button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-neutral-sub">
                      아직 추가된 소속 인원이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <h2 className="mb-3 text-lg font-bold text-neutral">소속 인원 추가</h2>
            <p className="mb-3 text-xs text-neutral-sub">
              여기서 정한 이메일/비밀번호를 해당 직원에게 직접 전달해주세요. 처음 로그인 후 비밀번호
              변경을 권장합니다.
            </p>
            <form onSubmit={addMember} className="flex max-w-md flex-col gap-3">
              <Input
                placeholder="이름"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="off"
                required
              />
              <Input
                type="email"
                placeholder="이메일"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="off"
                required
              />
              <Input
                type="password"
                placeholder="초기 비밀번호 (8자 이상)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                autoComplete="new-password"
                required
              />
              {error && <p className="text-sm text-accent">{error}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? "추가 중..." : "소속 인원 추가"}
              </Button>
            </form>

            {me.role === "SUPER_ADMIN" && (
              <section className="mt-12 rounded-2xl border border-accent-weak p-6">
                <h2 className="mb-2 text-lg font-bold text-accent">법인 멤버십 해지</h2>
                <p className="mb-4 text-xs text-neutral-sub">
                  해지하면 소속 인원 전체 로그인이 차단되고 향후 예약이 모두 취소됩니다. 되돌릴 수
                  없습니다. 이용 7일 이내는 멤버십 요금 전액을, 그 뒤는 남은 일수만큼 일할 계산하고
                  수수료 10%를 뗀 금액을 환불합니다.
                </p>
                {!refundPreview && (
                  <Button variant="secondary" onClick={previewRefund}>
                    해지 전 환불 금액 확인
                  </Button>
                )}
                {refundPreview && (
                  <div className="flex flex-col gap-3">
                    <dl className="grid grid-cols-2 gap-y-1 text-sm">
                      <dt className="text-neutral-sub">이용 일수</dt>
                      <dd className="text-right">{refundPreview.daysUsed.toFixed(1)}일</dd>
                      <dt className="text-neutral-sub">
                        {refundPreview.refundType === "FULL"
                          ? "전액 환불"
                          : "일할 계산 환불(수수료 10% 차감)"}
                      </dt>
                      <dd className="text-right font-bold text-primary">
                        {won(refundPreview.refundAmount)}
                      </dd>
                    </dl>
                    <Button variant="danger" onClick={terminateCompany} disabled={terminating}>
                      {terminating ? "해지 처리 중..." : "위 금액으로 법인 멤버십 해지"}
                    </Button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
