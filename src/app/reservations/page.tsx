"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiFetch } from "@/lib/api";
import { fmtDateTime, fmtTime } from "@/lib/format";
import { TopNav } from "@/components/TopNav";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SuccessBanner } from "@/components/ui/SuccessBanner";
import { ReservationBookingForm } from "@/components/ReservationBookingForm";

interface MyReservation {
  id: string;
  startAt: string;
  endAt: string;
  status: "BOOKED" | "CANCELLED";
  timeline: string;
  room: { name: string };
}

export default function ReservationsPage() {
  const ready = useRequireAuth();
  const [reservations, setReservations] = useState<MyReservation[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function load() {
    apiFetch<MyReservation[]>("/reservations/mine").then(setReservations);
  }

  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function cancel(id: string) {
    if (!confirm("이 예약을 취소할까요?")) return;
    await apiFetch(`/reservations/${id}/cancel`, { method: "PATCH" });
    load();
  }

  if (!ready) return null;

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral">예약 내역</h1>
          <Button onClick={() => setShowBookingModal(true)}>회의실 예약하기</Button>
        </div>
        <Link
          href="/rooms/map"
          className="mb-6 inline-block text-xs font-bold text-primary hover:underline"
        >
          회의실 배치도 보기
        </Link>

        {successMessage && (
          <SuccessBanner message={successMessage} onDismiss={() => setSuccessMessage(null)} />
        )}

        <ul className="flex flex-col gap-2">
          {reservations.map((r) => (
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
              <div className="flex items-center gap-3">
                <StatusBadge status={r.status === "CANCELLED" ? "cancelled" : r.timeline} />
                {r.status === "BOOKED" && r.timeline !== "past" && (
                  <Button variant="secondary" onClick={() => cancel(r.id)}>
                    취소
                  </Button>
                )}
              </div>
            </li>
          ))}
          {reservations.length === 0 && (
            <p className="text-sm text-neutral-sub">
              예약 내역이 없습니다. 우측 상단 "회의실 예약하기"로 첫 예약을 잡아보세요.
            </p>
          )}
        </ul>
      </main>

      {showBookingModal && (
        <Modal title="회의실 예약하기" onClose={() => setShowBookingModal(false)}>
          <ReservationBookingForm
            onBooked={(message) => {
              setShowBookingModal(false);
              setSuccessMessage(message);
              load();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
