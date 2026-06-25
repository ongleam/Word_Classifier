"use client";

import { useState } from "react";
import type { HistoryItem, TrendData } from "@/lib/types";
import { AnalysisDetail } from "@/components/AnalysisDetail";

export function TrendPanel({
  trend,
  loading,
  onRefresh,
}: {
  trend: TrendData | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">
          ③ 트렌드 · 분석 내역
        </h2>
        <div className="flex items-center gap-2">
          {trend && (
            <span className="text-xs text-slate-400">전체 {trend.total}건</span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-nh-green hover:text-nh-green disabled:opacity-50"
          >
            {loading ? "불러오는 중…" : "새로고침"}
          </button>
        </div>
      </div>

      {loading && !trend && (
        <p className="py-8 text-center text-sm text-slate-400">
          DB 전체 트렌드를 불러오는 중…
        </p>
      )}

      {!loading && !trend && (
        <p className="py-8 text-center text-sm text-slate-400">
          트렌드를 불러오지 못했습니다. 새로고침을 눌러 다시 시도하세요.
        </p>
      )}

      {trend && trend.total === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">
          DB에 저장된 분석 내역이 없습니다. 본문을 점검하면 여기에 트렌드가
          쌓입니다.
        </p>
      )}

      {trend && trend.total > 0 && (
        <div className="space-y-6">
          {/* 광고/정보 비율 */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">광고성 / 정보성 비율</span>
              <span className="text-slate-400">
                광고 {trend.adCount} · 정보 {trend.infoCount}
              </span>
            </div>
            <div className="flex h-6 w-full overflow-hidden rounded-lg bg-slate-100 text-xs font-medium text-white">
              <div
                className="flex items-center justify-center bg-amber-500"
                style={{ width: `${trend.adRatio * 100}%` }}
              >
                {trend.adRatio >= 0.12 && `${Math.round(trend.adRatio * 100)}%`}
              </div>
              <div
                className="flex items-center justify-center bg-sky-500"
                style={{ width: `${(1 - trend.adRatio) * 100}%` }}
              >
                {1 - trend.adRatio >= 0.12 &&
                  `${Math.round((1 - trend.adRatio) * 100)}%`}
              </div>
            </div>
          </div>

          {/* 키워드 빈도 */}
          {trend.topKeywords.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-medium text-slate-600">
                키워드 빈도 TOP {trend.topKeywords.length}
              </div>
              <BarList
                items={trend.topKeywords.map((k) => ({
                  label: k.keyword,
                  value: k.count,
                }))}
                color="bg-nh-green"
              />
            </div>
          )}

          {/* 주제 분포 */}
          {trend.topicDistribution.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-medium text-slate-600">
                주제 분포
              </div>
              <BarList
                items={trend.topicDistribution.map((t) => ({
                  label: t.topic,
                  value: t.count,
                }))}
                color="bg-indigo-400"
              />
            </div>
          )}

          {/* 분석 내역 (지금까지 분석한 전체) */}
          {trend.history.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-medium text-slate-600">
                분석 내역 ({trend.history.length}건)
              </div>
              <ul className="scroll-thin max-h-96 space-y-2 overflow-y-auto pr-1">
                {trend.history.map((h) => (
                  <HistoryRow key={h.id} h={h} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function HistoryRow({ h }: { h: HistoryItem }) {
  const [open, setOpen] = useState(false);
  const detail = h.result ?? null;
  const content = h.content;

  return (
    <li className="rounded-lg border border-slate-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2 p-2.5 text-left text-sm hover:bg-slate-50"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                h.classification === "광고성"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-sky-100 text-sky-700"
              }`}
            >
              {h.classification}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
              {h.topic}
            </span>
            <span className="text-xs text-slate-400">신뢰도 {h.confidence}%</span>
            {h.typo_count > 0 && (
              <span className="text-xs text-red-500">오탈자 {h.typo_count}</span>
            )}
            <span className="ml-auto text-xs text-slate-400">
              {fmtTime(h.created_at)}
            </span>
          </div>
          <p className={open ? "text-slate-600" : "line-clamp-2 text-slate-600"}>
            {content}
          </p>
        </div>
        <span className="mt-0.5 shrink-0 text-xs text-slate-400">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && detail && (
        <div className="border-t border-slate-100 p-3">
          <AnalysisDetail analysis={detail} content={content} />
        </div>
      )}
    </li>
  );
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

function BarList({
  items,
  color,
}: {
  items: { label: string; value: number }[];
  color: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-1.5">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2 text-sm">
          <span className="w-24 shrink-0 truncate text-right text-slate-500">
            {it.label}
          </span>
          <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100">
            <div
              className={`h-full ${color}`}
              style={{ width: `${(it.value / max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-xs text-slate-400">{it.value}</span>
        </li>
      ))}
    </ul>
  );
}
