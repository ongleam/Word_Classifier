"use client";

import { useState } from "react";
import type {
  AnalyzeResponse,
  BatchItemResult,
  BatchResponse,
  Compliance,
} from "@/lib/types";

export function AnalysisResult({
  data,
  batch,
  loading,
  error,
}: {
  data: AnalyzeResponse | null;
  batch: BatchResponse | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-slate-900">
        ② 오탈자 검사 · 광고성/정보성 AI 분류
      </h2>

      {loading && <Skeleton />}
      {!loading && error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      {!loading && !error && batch && <BatchResultView batch={batch} />}
      {!loading && !error && !batch && !data && (
        <p className="py-10 text-center text-sm text-slate-400">
          본문을 입력하고 점검 버튼을 누르면 결과가 표시됩니다.
        </p>
      )}

      {!loading && !batch && data && (
        <div className="space-y-4">
          {/* 분류 결과 */}
          <div className="flex items-center gap-3">
            <ClassBadge value={data.analysis.classification} />
            <span className="text-sm text-slate-500">
              신뢰도 {data.analysis.confidence}%
            </span>
            {!data.saved && (
              <span className="ml-auto text-xs text-slate-400">
                (DB 미저장)
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600">{data.analysis.reasoning}</p>

          {/* 메타 */}
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <Meta label="주제" value={data.analysis.topic} />
            <Meta label="어조" value={data.analysis.tone || "—"} />
            <Meta
              label="발송 타입"
              value={`${data.metrics.messageType} · ${data.metrics.byteLength}byte`}
            />
          </div>

          {/* 요약 */}
          {data.analysis.summary && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              {data.analysis.summary}
            </div>
          )}

          {/* 키워드 */}
          {data.analysis.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.analysis.keywords.map((k) => (
                <span
                  key={k}
                  className="rounded-full bg-nh-green/10 px-2.5 py-0.5 text-xs font-medium text-nh-greenDark"
                >
                  #{k}
                </span>
              ))}
            </div>
          )}

          {/* 광고 표기 의무 점검 */}
          <ComplianceBlock c={data.analysis.compliance} />

          {/* 오탈자 */}
          <TypoBlock typos={data.analysis.typos} />
        </div>
      )}
    </section>
  );
}

function BatchResultView({ batch }: { batch: BatchResponse }) {
  const adCount = batch.results.filter(
    (r) => r.analysis?.classification === "광고성",
  ).length;
  const infoCount = batch.results.filter(
    (r) => r.analysis?.classification === "정보성",
  ).length;

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg bg-slate-50 px-2 py-2">
          <div className="text-lg font-bold text-slate-800">{batch.ok}</div>
          <div className="text-xs text-slate-400">분석 성공</div>
        </div>
        <div className="rounded-lg bg-amber-50 px-2 py-2">
          <div className="text-lg font-bold text-amber-700">{adCount}</div>
          <div className="text-xs text-amber-600/70">광고성</div>
        </div>
        <div className="rounded-lg bg-sky-50 px-2 py-2">
          <div className="text-lg font-bold text-sky-700">{infoCount}</div>
          <div className="text-xs text-sky-600/70">정보성</div>
        </div>
      </div>
      {(batch.failed > 0 || batch.truncated) && (
        <p className="text-xs text-amber-600">
          {batch.failed > 0 && `실패 ${batch.failed}건. `}
          {batch.truncated && `최대 ${batch.maxBatch}건까지만 처리되었습니다.`}
        </p>
      )}

      {/* 건별 결과 (클릭하면 펼쳐짐) */}
      <ul className="scroll-thin max-h-[34rem] space-y-2 overflow-y-auto pr-1">
        {batch.results.map((r) => (
          <BatchItem key={r.index} r={r} />
        ))}
      </ul>
    </div>
  );
}

function BatchItem({ r }: { r: BatchItemResult }) {
  const [open, setOpen] = useState(false);
  const a = r.analysis;
  const flagged =
    a?.compliance?.needsAdPrefix &&
    (!a.compliance.hasAdPrefix ||
      !a.compliance.hasOptOut ||
      !a.compliance.hasSender);

  return (
    <li className="rounded-lg border border-slate-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2 p-2.5 text-left text-sm hover:bg-slate-50"
      >
        <span className="mt-0.5 shrink-0 text-xs text-slate-300">
          {r.index + 1}.
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            {r.ok && a ? (
              <>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    a.classification === "광고성"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-sky-100 text-sky-700"
                  }`}
                >
                  {a.classification}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                  {a.topic}
                </span>
                <span className="text-xs text-slate-400">{a.confidence}%</span>
                {a.typos.length > 0 && (
                  <span className="text-xs text-red-500">
                    오탈자 {a.typos.length}
                  </span>
                )}
                {flagged && (
                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600">
                    표기 위반
                  </span>
                )}
                {r.metrics && (
                  <span className="ml-auto text-xs text-slate-300">
                    {r.metrics.messageType}
                  </span>
                )}
              </>
            ) : (
              <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600">
                분석 실패
              </span>
            )}
          </div>
          <p className={open ? "text-slate-600" : "line-clamp-2 text-slate-600"}>
            {r.content}
          </p>
        </div>
        <span className="mt-0.5 shrink-0 text-xs text-slate-400">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && r.ok && a && (
        <div className="space-y-3 border-t border-slate-100 p-3 pt-3">
          {a.reasoning && <p className="text-sm text-slate-600">{a.reasoning}</p>}
          {a.summary && (
            <div className="rounded-lg bg-slate-50 p-2.5 text-sm text-slate-600">
              {a.summary}
            </div>
          )}
          {a.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {a.keywords.map((k) => (
                <span
                  key={k}
                  className="rounded-full bg-nh-green/10 px-2.5 py-0.5 text-xs font-medium text-nh-greenDark"
                >
                  #{k}
                </span>
              ))}
            </div>
          )}
          <ComplianceBlock c={a.compliance} />
          <TypoBlock typos={a.typos} />
        </div>
      )}
    </li>
  );
}

function ClassBadge({ value }: { value: "광고성" | "정보성" }) {
  const ad = value === "광고성";
  return (
    <span
      className={`rounded-lg px-3 py-1 text-sm font-bold ${
        ad ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"
      }`}
    >
      {value}
    </span>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="truncate font-medium text-slate-700">{value}</div>
    </div>
  );
}

function ComplianceBlock({ c }: { c: Compliance }) {
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

function TypoBlock({
  typos,
}: {
  typos: { original: string; suggestion: string; reason: string }[];
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
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-7 w-24 rounded bg-slate-200" />
      <div className="h-4 w-3/4 rounded bg-slate-200" />
      <div className="grid grid-cols-3 gap-2">
        <div className="h-12 rounded bg-slate-200" />
        <div className="h-12 rounded bg-slate-200" />
        <div className="h-12 rounded bg-slate-200" />
      </div>
      <div className="h-20 rounded bg-slate-200" />
    </div>
  );
}
