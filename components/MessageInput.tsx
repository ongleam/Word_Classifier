"use client";

import { computeMetrics } from "@/lib/sms";

const SAMPLES: { label: string; text: string }[] = [
  {
    label: "광고 (완비)",
    text:
      "(광고)NH농협 가을 정기예금 특별금리 연 4.1% 이벤트! 지금 비대면 가입 시 모바일상품권 증정. 자세히 보기 https://nh.to/abcd 무료거부 080-123-4567",
  },
  {
    label: "광고 (표기누락)",
    text:
      "NH올원카드 신규 발급하고 스타벅스 아메리카노 받으세요! 이번주말 한정 혜택 놓치지 마세요 지금신청 nh.to/xyz",
  },
  {
    label: "정보성",
    text:
      "[NH농협] 고객님의 계좌에서 2026.06.23 320,000원이 출금되었습니다. 잔액 1,250,000원. 본인거래가 아닐 경우 1588-0000으로 문의주세요.",
  },
  {
    label: "오탈자 포함",
    text:
      "(광고)NH투자증권 신규 계좌 개설하시고 거래 수수료 평셍 무료 혜택을 받아보세요. 자세한 내용은 어플에서 확인 하세요. 무료거부 080-999-0000",
  },
];

export function MessageInput({
  value,
  onChange,
  onAnalyze,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  loading: boolean;
}) {
  const m = computeMetrics(value);
  const overSms = m.byteLength > m.byteLimitSMS;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">① 발송 본문 입력</h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            overSms
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {m.messageType}
        </span>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="점검할 마케팅 SMS/LMS 본문을 붙여넣으세요."
        rows={7}
        className="scroll-thin w-full resize-none rounded-lg border border-slate-300 p-3 text-sm leading-relaxed text-slate-800 outline-none focus:border-nh-green focus:ring-2 focus:ring-nh-green/20"
      />

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>{m.charCount}자</span>
        <span className={overSms ? "font-semibold text-amber-600" : ""}>
          {m.byteLength} byte{" "}
          <span className="text-slate-400">/ SMS {m.byteLimitSMS}byte</span>
        </span>
        {overSms && <span className="text-amber-600">→ LMS로 발송됩니다</span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="self-center text-xs text-slate-400">예시:</span>
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onChange(s.text)}
            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 hover:border-nh-green hover:text-nh-green"
          >
            {s.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onAnalyze}
        disabled={loading || !value.trim()}
        className="mt-4 w-full rounded-lg bg-nh-green py-2.5 text-sm font-semibold text-white transition hover:bg-nh-greenDark disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {loading ? "분석 중…" : "본문 점검·분석"}
      </button>
    </section>
  );
}
