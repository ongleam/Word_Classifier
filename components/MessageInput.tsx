"use client";

import { useState } from "react";
import { computeMetrics } from "@/lib/sms";

const MAX_DROP_CHARS = 4000; // analyze API 본문 한도와 동일

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

  const [dragOver, setDragOver] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);

  async function readDroppedFile(file: File) {
    setDropError(null);
    // 텍스트 계열만 허용 (.txt/.csv 또는 빈 type)
    const okType =
      file.type.startsWith("text/") ||
      /\.(txt|csv|md)$/i.test(file.name) ||
      file.type === "";
    if (!okType) {
      setDropError("텍스트 파일(.txt, .csv)만 끌어다 놓을 수 있습니다.");
      return;
    }
    try {
      const text = (await file.text()).trim();
      onChange(text.slice(0, MAX_DROP_CHARS));
      if (text.length > MAX_DROP_CHARS) {
        setDropError(`파일이 길어 앞 ${MAX_DROP_CHARS}자만 불러왔습니다.`);
      }
    } catch {
      setDropError("파일을 읽지 못했습니다.");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void readDroppedFile(file);
  }

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

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        className="relative"
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="점검할 마케팅 SMS/LMS 본문을 붙여넣거나, 텍스트 파일(.txt, .csv)을 끌어다 놓으세요."
          rows={7}
          className={`scroll-thin w-full resize-none rounded-lg border p-3 text-sm leading-relaxed text-slate-800 outline-none focus:border-nh-green focus:ring-2 focus:ring-nh-green/20 ${
            dragOver ? "border-nh-green" : "border-slate-300"
          }`}
        />
        {dragOver && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-nh-green bg-nh-green/5 text-sm font-medium text-nh-greenDark">
            텍스트 파일을 여기에 놓으세요
          </div>
        )}
      </div>

      {dropError && <p className="mt-1.5 text-xs text-amber-600">{dropError}</p>}

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
