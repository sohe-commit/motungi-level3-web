"use client";

import { useEffect, useRef, useState } from "react";
import { consumeFlash } from "@/lib/flash";
import { SuccessBanner } from "@/components/ui/SuccessBanner";

// 다른 화면(가입/예약/제보 등)에서 완료 후 이동해 온 경우, 그 완료 메시지를 한 번 보여준다
export function FlashBanner() {
  const [message, setMessage] = useState<string | null>(null);
  const consumed = useRef(false);

  useEffect(() => {
    // 개발 모드 StrictMode는 이 effect를 두 번 실행하는데, 두 번째 호출에서 다시
    // consumeFlash()를 부르면 이미 지워진 값이라 메시지가 바로 사라져버린다 — 한 번만 읽는다
    if (consumed.current) return;
    consumed.current = true;
    setMessage(consumeFlash());
  }, []);

  if (!message) return null;
  return <SuccessBanner message={message} onDismiss={() => setMessage(null)} />;
}
