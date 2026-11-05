"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { fmtTime } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface EquipmentType {
  id: string;
  name: string;
}
interface Room {
  id: string;
  name: string;
  capacity: number;
  available: boolean;
  equipmentLinks: { equipmentType: { id: string; name: string } }[];
  activeIssues: { id: string; content: string }[];
}
interface BusySlot {
  startAt: string;
  endAt: string;
  mine: boolean;
}

function todayStr() {
  // toISOString()은 UTC 기준이라 자정 전후(KST)에 하루 어긋난다 — 로컬 날짜로 직접 조립
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// 운영시간(08:00~22:00) 안에서 30분 단위로만 고를 수 있게 — 네이티브 시간 피커 대신 드롭다운으로
const TIME_SLOTS = Array.from({ length: (22 - 8) * 2 + 1 }, (_, i) => {
  const totalMinutes = 8 * 60 + i * 30;
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const m = String(totalMinutes % 60).padStart(2, "0");
  return `${h}:${m}`;
});

function timeLabel(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${h12}:${String(m).padStart(2, "0")}`;
}

export function ReservationBookingForm({ onBooked }: { onBooked: (message: string) => void }) {
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [equipmentFilter, setEquipmentFilter] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [attendeeCount, setAttendeeCount] = useState(2);

  const [searched, setSearched] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [dayBusySlots, setDayBusySlots] = useState<BusySlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDate(todayStr());
  }, []);

  useEffect(() => {
    apiFetch<EquipmentType[]>("/rooms/equipment-types").then(setEquipmentTypes);
  }, []);

  useEffect(() => {
    if (!selectedRoomId || !date) {
      setDayBusySlots([]);
      return;
    }
    apiFetch<{ busySlots: BusySlot[] }>(`/rooms/${selectedRoomId}/availability?date=${date}`).then(
      (res) => setDayBusySlots(res.busySlots),
    );
  }, [selectedRoomId, date]);

  async function search() {
    setError(null);
    setSelectedRoomId(null);
    const qs = new URLSearchParams({
      date,
      startTime,
      endTime,
      attendeeCount: String(attendeeCount),
      ...(equipmentFilter ? { equipmentTypeId: equipmentFilter } : {}),
    });
    const list = await apiFetch<Room[]>(`/rooms/available?${qs.toString()}`);
    setRooms(list);
    setSearched(true);
  }

  async function confirmReserve() {
    if (!selectedRoomId) return;
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/reservations", {
        method: "POST",
        body: JSON.stringify({
          roomId: selectedRoomId,
          startAt: `${date}T${startTime}:00`,
          endAt: `${date}T${endTime}:00`,
          attendeeCount,
        }),
      });
      onBooked("회의실 예약이 완료되었습니다.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "예약에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-sub">
        먼저 원하는 날짜·시간·인원·장비 조건을 정하면, 그 조건에 맞고 비어있는 회의실만
        보여드려요.
      </p>

      <div className="flex flex-col gap-4 rounded-2xl border border-neutral-weak3 p-5">
        <div>
          <label className="mb-1 block text-xs font-bold text-neutral-sub">날짜</label>
          <Input
            type="date"
            value={date}
            min={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-bold text-neutral-sub">시작 시각</label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-weak3 px-4 text-sm text-neutral outline-none focus:border-primary"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {timeLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-bold text-neutral-sub">종료 시각</label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-weak3 px-4 text-sm text-neutral outline-none focus:border-primary"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {timeLabel(t)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-neutral-sub">참석 인원</label>
          <Input
            type="number"
            min={1}
            value={attendeeCount}
            onChange={(e) => setAttendeeCount(Number(e.target.value))}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-neutral-sub">필요한 장비</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEquipmentFilter("")}
              className={`h-9 rounded-full px-4 text-xs font-bold ${
                equipmentFilter === "" ? "bg-neutral text-white" : "bg-neutral-weak text-neutral-sub"
              }`}
            >
              상관없음
            </button>
            {equipmentTypes.map((eq) => (
              <button
                type="button"
                key={eq.id}
                onClick={() => setEquipmentFilter(eq.id)}
                className={`h-9 rounded-full px-4 text-xs font-bold ${
                  equipmentFilter === eq.id
                    ? "bg-neutral text-white"
                    : "bg-neutral-weak text-neutral-sub"
                }`}
              >
                {eq.name}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={search}>이 조건으로 회의실 찾기</Button>
      </div>

      {searched && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-neutral-sub">
            조건에 맞는 회의실 {rooms.filter((r) => r.available).length}곳
          </h3>
          <div className="flex flex-col gap-2">
            {rooms.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRoomId(r.id)}
                className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-colors ${
                  !r.available
                    ? "border-neutral-weak2 opacity-60"
                    : selectedRoomId === r.id
                      ? "border-primary bg-primary-weak"
                      : "border-neutral-weak3 hover:bg-neutral-weak"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-neutral">{r.name}</p>
                    {r.activeIssues.length > 0 && (
                      <span
                        title={r.activeIssues.map((i) => i.content).join("\n")}
                        className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-warning text-[10px] font-bold text-white"
                        aria-label={`현재 알려진 문제: ${r.activeIssues.map((i) => i.content).join(", ")}`}
                      >
                        !
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-sub">
                    정원 {r.capacity}명
                    {r.equipmentLinks.length > 0 &&
                      " · " + r.equipmentLinks.map((l) => l.equipmentType.name).join(", ")}
                  </p>
                </div>
                <span className="text-xs font-bold text-neutral-sub">
                  {r.available ? "예약 가능" : "이미 예약됨"}
                </span>
              </button>
            ))}
            {rooms.length === 0 && (
              <p className="text-sm text-neutral-sub">조건에 맞는 회의실이 없습니다.</p>
            )}
          </div>
        </div>
      )}

      {selectedRoomId && dayBusySlots.length > 0 && (
        <div className="rounded-xl bg-neutral-weak p-4 text-xs text-neutral-sub">
          <p className="mb-2 font-bold">이 회의실의 오늘 예약된 시간대</p>
          <ul className="flex flex-col gap-1">
            {dayBusySlots.map((s, i) => (
              <li key={i}>
                {fmtTime(s.startAt)} ~ {fmtTime(s.endAt)} {s.mine ? "(내 예약)" : "— 예약됨"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="text-sm text-accent">{error}</p>}

      {selectedRoomId && rooms.find((r) => r.id === selectedRoomId)?.available && (
        <Button onClick={confirmReserve} disabled={loading}>
          {loading ? "예약 처리 중..." : "선택한 회의실로 예약하기"}
        </Button>
      )}
    </div>
  );
}
