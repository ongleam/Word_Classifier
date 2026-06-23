"use client";

import { computeMetrics } from "@/lib/sms";

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
