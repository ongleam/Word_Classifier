"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageInput } from "@/components/MessageInput";
import { AnalysisResult } from "@/components/AnalysisResult";
import { TrendPanel } from "@/components/TrendPanel";
import type { AnalyzeResponse, TrendData } from "@/lib/types";

export default function Page() {
  const [content, setContent] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trend, setTrend] = useState<TrendData | null>(null);
  const [trendConfigured, setTrendConfigured] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);

  const loadTrends = useCallback(async () => {
    setTrendLoading(true);
    try {
      const res = await fetch("/api/trends", { cache: "no-store" });
      const json = await res.json();
      setTrend(json.trend ?? null);
      setTrendConfigured(json.configured !== false);
    } catch {
      setTrend(null);
    } finally {
      setTrendLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  const analyze = useCallback(async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
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
        setResult(json as AnalyzeResponse);
        if (json.saved) loadTrends(); // 저장됐으면 트렌드 갱신
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [content, loadTrends]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* 헤더 */}
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-nh-green text-lg font-black text-white">
          NH
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            SMS 발송 본문 점검 대시보드
          </h1>
          <p className="text-xs text-slate-500">
            NH SMS · PoC — 오탈자 검사 · 광고성/정보성 AI 분류 · 트렌드 분석
          </p>
        </div>
        <span className="ml-auto rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          Powered by Claude
        </span>
      </header>

      {/* 한 화면 3패널 레이아웃 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <MessageInput
            value={content}
            onChange={setContent}
            onAnalyze={analyze}
            loading={loading}
          />
        </div>
        <div className="lg:col-span-1">
          <AnalysisResult data={result} loading={loading} error={error} />
        </div>
        <div className="lg:col-span-1">
          <TrendPanel
            trend={trend}
            configured={trendConfigured}
            loading={trendLoading}
          />
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400">
        분석 결과는 AI 추정값으로 참고용이며, 실제 발송 전 담당자 최종 검수가
        필요합니다.
      </footer>
    </main>
  );
}
