"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiFetch } from "@/lib/api";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/Button";

interface Room {
  id: string;
  name: string;
  capacity: number;
  floor: number;
  zone: string;
  equipmentLinks: { equipmentType: { id: string; name: string } }[];
  activeIssues: { id: string; content: string }[];
}

export default function RoomMapPage() {
  const ready = useRequireAuth();
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (!ready) return;
    apiFetch<Room[]>("/rooms").then(setRooms);
  }, [ready]);

  if (!ready) return null;

  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral">회의실 배치도</h1>
          <Link href="/reservations">
            <Button variant="secondary">예약하러 가기</Button>
          </Link>
        </div>
        <p className="mb-6 text-sm text-neutral-sub">
          각 회의실이 건물 몇 층, 어느 구역에 있는지 미리 확인할 수 있어요.
        </p>

        {floors.map((floor) => {
          const roomsOnFloor = rooms.filter((r) => r.floor === floor);
          const zones = Array.from(new Set(roomsOnFloor.map((r) => r.zone)));
          return (
            <div key={floor} className="mb-8">
              <h2 className="mb-3 text-lg font-bold text-neutral">{floor}층</h2>
              {zones.map((zone) => (
                <div key={zone} className="mb-4">
                  <h3 className="mb-2 text-xs font-bold text-neutral-sub">{zone}</h3>
                  <div className="flex flex-wrap gap-3">
                    {roomsOnFloor
                      .filter((r) => r.zone === zone)
                      .map((r) => (
                        <div
                          key={r.id}
                          className="w-48 rounded-2xl border border-neutral-weak3 p-4"
                        >
                          <div className="mb-1 flex items-center gap-1.5">
                            <p className="font-bold text-neutral">{r.name}</p>
                            {r.activeIssues.length > 0 && (
                              <span
                                title={r.activeIssues.map((i) => i.content).join("\n")}
                                className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-warning text-[10px] font-bold text-white"
                                aria-label={`현재 알려진 문제: ${r.activeIssues
                                  .map((i) => i.content)
                                  .join(", ")}`}
                              >
                                !
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-sub">정원 {r.capacity}명</p>
                          {r.equipmentLinks.length > 0 && (
                            <p className="mt-1 text-xs text-neutral-sub">
                              {r.equipmentLinks.map((l) => l.equipmentType.name).join(", ")}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {rooms.length === 0 && <p className="text-sm text-neutral-sub">불러오는 중...</p>}
      </main>
    </div>
  );
}
