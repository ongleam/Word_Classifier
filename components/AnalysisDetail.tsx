"use client";

import { useState } from "react";
import type { AnalysisResult, Compliance, Typo } from "@/lib/types";
import { applyTypoCorrections } from "@/lib/typo";

/** 분류 근거·요약·키워드·표기점검·오탈자 — 단일/일괄/내역 공통 상세 블록 */
export function AnalysisDetail({
  analysis,
  content,
}: {
  analysis: AnalysisResult;
  content?: string;
}) {
  return (
    <div className="space-y-3">
      {analysis.reasoning && (
        <p className="text-sm text-slate-600">{analysis.reasoning}</p>
      )}
      {analysis.summary && (
        <div className="rounded-lg bg-slate-50 p-2.5 text-sm text-slate-600">
          {analysis.summary}
        </div>
      )}
      {analysis.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {analysis.keywords.map((k) => (
            <span
              key={k}
              className="rounded-full bg-nh-green/10 px-2.5 py-0.5 text-xs font-medium text-nh-greenDark"
            >
              #{k}
            </span>
          ))}
        </div>
      )}
      <ComplianceBlock c={analysis.compliance} />
      <TypoBlock typos={analysis.typos} content={content} />
    </div>
  );
}

export function ComplianceBlock({ c }: { c: Compliance }) {
  // 정보성이면 표기 의무 비대상
  if (!c.needsAdPrefix) {
    return (
      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-500">
        정보성 메시지 — 광고 표기 의무 비대상
      </div>
    );
  }

  const items = [
    { ok: c.hasAdPrefix, label: "(광고) 표기" },
    { ok: c.hasOptOut, label: "무료수신거부 안내" },
    { ok: c.hasSender, label: "발신주체 표기" },
  ];

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="mb-2 text-xs font-semibold text-slate-500">
        광고 표기 의무 점검 (정보통신망법)
      </div>
      <ul className="space-y-1 text-sm">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2">
            <span className={it.ok ? "text-emerald-500" : "text-red-500"}>
              {it.ok ? "✓" : "✗"}
            </span>
            <span className={it.ok ? "text-slate-600" : "text-red-600"}>
              {it.label}
            </span>
          </li>
        ))}
      </ul>
      {c.issues.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-red-600">
          {c.issues.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TypoBlock({
  typos,
  content,
}: {
  typos: Typo[];
  content?: string;
}) {
  if (typos.length === 0) {
    return (
      <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
        ✓ 오탈자/맞춤법 이슈가 발견되지 않았습니다.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="mb-2 text-xs font-semibold text-slate-500">
        오탈자 · 맞춤법 ({typos.length}건)
      </div>
      <ul className="space-y-2 text-sm">
        {typos.map((t, idx) => (
          <li key={idx} className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600 line-through">
              {t.original}
            </span>
            <span className="text-slate-400">→</span>
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
              {t.suggestion}
            </span>
            <span className="text-xs text-slate-400">({t.reason})</span>
          </li>
        ))}
      </ul>
      {content && <CorrectedCopy content={content} typos={typos} />}
    </div>
  );
}

/** 오탈자 검수가 끝난 본문 — 교정안을 적용한 글을 보여주고 복사 버튼 제공 */
function CorrectedCopy({ content, typos }: { content: string; typos: Typo[] }) {
  const [copied, setCopied] = useState(false);
  const corrected = applyTypoCorrections(content, typos);

  async function copy() {
    try {
      await navigator.clipboard.writeText(corrected);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 클립보드 권한 없음 등 — 무시 */
    }
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">교정된 본문</span>
        <button
          type="button"
          onClick={copy}
          className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-nh-green hover:text-nh-green"
        >
          {copied ? "복사됨 ✓" : "교정문 복사"}
        </button>
      </div>
      <p className="whitespace-pre-wrap rounded-lg bg-emerald-50/60 p-2.5 text-sm text-slate-700">
        {corrected}
      </p>
    </div>
  );
}
