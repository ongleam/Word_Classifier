"use client";

import { useCallback, useMemo, useState } from "react";
import { MessageInput } from "@/components/MessageInput";
import { AnalysisResult } from "@/components/AnalysisResult";
import { TrendPanel } from "@/components/TrendPanel";
import { computeTrend } from "@/lib/trends";
import type {
  AnalyzeResponse,
  BatchResponse,
  SessionEntry,
} from "@/lib/types";

function makeId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type Tab = "input" | "result" | "trend";

const TABS: { key: Tab; label: string }[] = [
  { key: "input", label: "① 본문 입력" },
  { key: "result", label: "② 분석 결과" },
  { key: "trend", label: "③ 트렌드·내역" },
];

export default function Page() {
  const [tab, setTab] = useState<Tab>("input");

  const [content, setContent] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [batchResult, setBatchResult] = useState<BatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [batchLoading, setBatchLoading] = useState(false);

  // 이번 세션에서 분석한 결과만 모아 트렌드를 집계 (DB 전체 통계는 사용 안 함)
  const [sessionEntries, setSessionEntries] = useState<SessionEntry[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const trend = useMemo(() => computeTrend(sessionEntries), [sessionEntries]);

  const analyze = useCallback(async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setBatchResult(null); // 단일 분석 시 일괄 결과 비움
    setTab("result"); // 분석 시작과 동시에 결과 탭으로 전환
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "분석에 실패했습니다.");
        setResult(null);
      } else {
        const data = json as AnalyzeResponse;
        setResult(data);
        setSessionEntries((prev) => [
          ...prev,
          {
            id: makeId(),
            created_at: new Date().toISOString(),
            content,
            metrics: data.metrics,
            analysis: data.analysis,
          },
        ]);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [content]);

  const analyzeBatch = useCallback(
    async (messages: string[]) => {
      setBatchLoading(true);
      setToast(null);
      setError(null);
      try {
        const res = await fetch("/api/analyze/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: messages }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "일괄 분석에 실패했습니다.");
          setBatchResult(null);
        } else {
          const data = json as BatchResponse;
          setResult(null); // 단일 결과 비우고 일괄 결과 표시
          setBatchResult(data);
          setToast(
            `일괄 분석 완료 — 성공 ${data.ok}건${
              data.failed ? `, 실패 ${data.failed}건` : ""
            }${data.truncated ? ` (최대 ${data.maxBatch}건까지만 처리)` : ""}`,
          );
          const entries = data.results
            .filter((r) => r.ok && r.analysis && r.metrics)
            .map<SessionEntry>((r) => ({
              id: makeId(),
              created_at: new Date().toISOString(),
              content: r.content,
              metrics: r.metrics!,
              analysis: r.analysis!,
            }));
          if (entries.length) {
            setSessionEntries((prev) => [...prev, ...entries]);
          }
        }
        setTab("result"); // 건별 결과는 ② 분석 결과 탭에서 확인
      } catch {
        setError("네트워크 오류가 발생했습니다.");
        setTab("result");
      } finally {
        setBatchLoading(false);
      }
    },
    [],
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {/* 탭 바 */}
      <div className="mb-5 flex gap-1 rounded-lg bg-slate-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-800 px-4 py-2.5 text-sm text-white">
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-3 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* 패널 */}
      {tab === "input" && (
        <MessageInput
          value={content}
          onChange={setContent}
          onAnalyze={analyze}
          loading={loading}
          onAnalyzeBatch={analyzeBatch}
          batchLoading={batchLoading}
        />
      )}
      {tab === "result" && (
        <AnalysisResult
          data={result}
          batch={batchResult}
          loading={loading || batchLoading}
          error={error}
        />
      )}
      {tab === "trend" && <TrendPanel trend={trend} />}
    </main>
  );
}
