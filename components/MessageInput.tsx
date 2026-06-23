"use client";

import { useRef, useState } from "react";
import { computeMetrics } from "@/lib/sms";
import { parseMessages } from "@/lib/csv";

const MAX_DROP_CHARS = 4000; // analyze API 본문 한도와 동일

export function MessageInput({
  value,
  onChange,
  onAnalyze,
  loading,
  onAnalyzeBatch,
  batchLoading,
}: {
  value: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  loading: boolean;
  onAnalyzeBatch: (messages: string[]) => void;
  batchLoading: boolean;
}) {
  const m = computeMetrics(value);
  const overSms = m.byteLength > m.byteLimitSMS;

  const [dragOver, setDragOver] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const [batch, setBatch] = useState<string[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function readFile(file: File) {
    setDropError(null);
    setBatch(null);
    const okType =
      file.type.startsWith("text/") ||
      /\.(txt|csv|md)$/i.test(file.name) ||
      file.type === "";
    if (!okType) {
      setDropError("텍스트 파일(.txt, .csv)만 불러올 수 있습니다.");
      return;
    }
    try {
      const text = await file.text();
      const messages = parseMessages(text);
      if (messages.length === 0) {
        setDropError("파일에서 본문을 찾지 못했습니다.");
      } else if (messages.length === 1) {
        // 단일 메시지 → 입력창 채우기
        onChange(messages[0].slice(0, MAX_DROP_CHARS));
      } else {
        // 여러 건 → 일괄 분석 모드
        setBatch(messages);
      }
    } catch {
      setDropError("파일을 읽지 못했습니다.");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void readFile(file);
  }

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void readFile(file);
    e.target.value = ""; // 같은 파일 재선택 허용
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">① 발송 본문 입력</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-nh-green hover:text-nh-green"
          >
            파일 업로드
          </button>
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
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.csv,.md,text/*"
        onChange={handlePick}
        className="hidden"
      />

      {/* 일괄 분석 모드 */}
      {batch ? (
        <div className="rounded-lg border border-nh-green/40 bg-nh-green/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-nh-greenDark">
              파일에서 {batch.length}건을 불러왔습니다
            </span>
            <button
              type="button"
              onClick={() => setBatch(null)}
              disabled={batchLoading}
              className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              취소
            </button>
          </div>
          <ul className="scroll-thin mb-3 max-h-44 space-y-1 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-600">
            {batch.slice(0, 50).map((msg, i) => (
              <li key={i} className="flex gap-2 border-b border-slate-50 py-1 last:border-0">
                <span className="shrink-0 text-slate-300">{i + 1}.</span>
                <span className="truncate">{msg}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onAnalyzeBatch(batch)}
            disabled={batchLoading}
            className="w-full rounded-lg bg-nh-green py-2.5 text-sm font-semibold text-white transition hover:bg-nh-greenDark disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {batchLoading
              ? `일괄 분석 중… (${batch.length}건)`
              : `${batch.length}건 일괄 분석`}
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">
            분석 결과는 ③ 탭의 내역·트렌드에서 확인할 수 있습니다 (최대 50건/회)
          </p>
        </div>
      ) : (
        <>
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
              placeholder="점검할 마케팅 SMS/LMS 본문을 붙여넣거나, 텍스트 파일(.txt, .csv)을 끌어다 놓으세요. 여러 건이면 일괄 분석됩니다."
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

          {dropError && (
            <p className="mt-1.5 text-xs text-amber-600">{dropError}</p>
          )}

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
        </>
      )}
    </section>
  );
}
