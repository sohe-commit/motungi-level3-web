"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiFetch, ApiError } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/Button";
import { SuccessBanner } from "@/components/ui/SuccessBanner";

interface QuotaSummary {
  membershipType: string;
}
interface MySpace {
  spaceType: "SEAT" | "OFFICE";
  spaceNumber: string;
  endDate: string;
}
interface AvailableSpace {
  id: string;
  spaceType: "SEAT" | "OFFICE";
  spaceNumber: string;
  floor: number;
  zone: string;
  available: boolean;
}

const MEMBERSHIP_TO_SPACE_TYPE: Record<string, "SEAT" | "OFFICE" | undefined> = {
  고정석: "SEAT",
  오피스: "OFFICE",
};

export default function SelectSpacePage() {
  const ready = useRequireAuth();
  const [membershipType, setMembershipType] = useState<string | null>(null);
  const [mySpace, setMySpace] = useState<MySpace | null>(null);
  const [spaces, setSpaces] = useState<AvailableSpace[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const spaceType = membershipType ? MEMBERSHIP_TO_SPACE_TYPE[membershipType] : undefined;

  function load() {
    apiFetch<QuotaSummary>("/membership/overview")
      .then((q) => setMembershipType(q.membershipType))
      .catch(() => setMembershipType(null));
    apiFetch<MySpace | null>("/membership/my-space").then(setMySpace);
  }

  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!spaceType || mySpace) return;
    apiFetch<AvailableSpace[]>(`/membership/available-spaces?spaceType=${spaceType}`).then(setSpaces);
  }, [spaceType, mySpace]);

  async function confirm() {
    if (!selected) return;
    setError(null);
    setLoading(true);
    try {
      const assignedNumber = selected;
      await apiFetch("/membership/my-space", { method: "POST", body: JSON.stringify({ spaceNumber: selected }) });
      setMessage(`${assignedNumber} 배정이 완료되었습니다.`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "배정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  const zones = Array.from(new Set(spaces.map((s) => s.zone)));

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-2 text-2xl font-bold text-neutral">내 공간 선택</h1>
        <p className="mb-6 text-sm text-neutral-sub">
          모퉁이 건물 구조도에서 비어있는 자리/호실을 직접 선택할 수 있어요.
        </p>

        {message && <SuccessBanner message={message} onDismiss={() => setMessage(null)} />}

        {membershipType && !spaceType && (
          <p className="text-sm text-neutral-sub">
            {membershipType} 멤버십은 지정된 전용 공간이 없습니다. 고정석이 아닌 일반석 구역을
            자유롭게 이용해주세요.
          </p>
        )}

        {mySpace && (
          <div className="mb-6 rounded-2xl border border-primary bg-primary-weak p-5">
            <p className="text-sm font-bold text-neutral">
              이미 {mySpace.spaceType === "OFFICE" ? "오피스" : "고정석"} {mySpace.spaceNumber}가(이)
              배정되어 있어요.
            </p>
            <p className="mt-1 text-xs text-neutral-sub">
              {fmtDate(mySpace.endDate)}까지 · 변경은 모퉁이 운영진에게
              문의해주세요.
            </p>
          </div>
        )}

        {spaceType && !mySpace && (
          <>
            {zones.map((zone) => (
              <div key={zone} className="mb-6">
                <h2 className="mb-3 text-sm font-bold text-neutral-sub">{zone}</h2>
                <div className="flex flex-wrap gap-2">
                  {spaces
                    .filter((s) => s.zone === zone)
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setSelected(s.spaceNumber)}
                        className={`flex h-16 w-20 flex-col items-center justify-center rounded-xl border text-xs font-bold transition-colors ${
                          !s.available
                            ? "cursor-not-allowed border-neutral-weak2 bg-neutral-weak text-neutral-sub"
                            : selected === s.spaceNumber
                              ? "border-primary bg-primary text-white"
                              : "border-primary-weak bg-white text-neutral hover:bg-primary-weak"
                        }`}
                      >
                        <span>{s.spaceNumber}</span>
                        <span className="text-[10px] font-normal">
                          {s.available ? "선택 가능" : "사용 중"}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            ))}

            {error && <p className="mb-4 text-sm text-accent">{error}</p>}

            {selected && (
              <Button onClick={confirm} disabled={loading}>
                {loading ? "배정 처리 중..." : `${selected} 선택 확정하기`}
              </Button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
