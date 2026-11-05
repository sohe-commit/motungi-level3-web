import Link from "next/link";

export default function PoliciesPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold text-neutral">이용 규정</h1>
      <p className="mb-8 text-sm text-neutral-sub">
        모퉁이 공유오피스를 이용하기 전 아래 내용을 꼭 확인해주세요.
      </p>

      <section className="mb-6 rounded-2xl border border-neutral-weak3 p-6">
        <h2 className="mb-2 text-sm font-bold text-neutral-sub">출입 시간</h2>
        <p className="text-sm text-neutral">자유석 07:00~22:00, 고정석·오피스 24시간</p>
        <p className="mt-1 text-xs text-neutral-sub">
          건물 물리적 출입 통제(출입카드·도어락 등)는 이 시스템의 범위 밖이며, 안내 문구로만
          제공됩니다.
        </p>
      </section>

      <section className="mb-6 rounded-2xl border border-neutral-weak3 p-6">
        <h2 className="mb-2 text-sm font-bold text-neutral-sub">회의실 취소</h2>
        <p className="text-sm text-neutral">예약 시작 1시간 전까지 취소할 수 있습니다.</p>
        <p className="mt-1 text-xs text-neutral-sub">
          그 뒤의 취소는 이용한 것으로 간주해 이번 결제 주기 이용시간에서 환원되지 않습니다.
        </p>
      </section>

      <section className="mb-6 rounded-2xl border border-neutral-weak3 p-6">
        <h2 className="mb-2 text-sm font-bold text-neutral-sub">멤버십 환불</h2>
        <p className="text-sm text-neutral">
          이용 7일 이내 해지 시 멤버십 요금 전액을, 그 뒤에는 남은 일수만큼 일할 계산하고 수수료
          10%를 뗀 금액을 환불합니다.
        </p>
        <p className="mt-1 text-xs text-neutral-sub">
          해지 화면에서 예상 환불 금액을 미리 계산해서 보여드립니다. 단, 실제 결제 취소/송금은 이
          시스템의 범위 밖이라 계산된 금액을 안내만 합니다.
        </p>
      </section>

      <section className="mb-8 rounded-2xl border border-neutral-weak3 p-6">
        <h2 className="mb-2 text-sm font-bold text-neutral-sub">회의실 내 음식</h2>
        <p className="text-sm text-neutral">음료만 가능하며, 식사는 금지됩니다.</p>
      </section>

      <Link href="/login" className="text-sm font-bold text-primary hover:underline">
        ← 로그인으로 돌아가기
      </Link>
    </div>
  );
}
