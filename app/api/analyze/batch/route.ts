import { NextResponse } from "next/server";
import { analyzeMessage } from "@/lib/analyze";
import { computeMetrics } from "@/lib/sms";
import { getSupabase, ANALYSES_TABLE, contentHash } from "@/lib/supabase";
import type { BatchItemResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300; // 다건 분석 — 넉넉히

const MAX_BATCH = 50; // 한 번에 처리할 최대 건수
const CONCURRENCY = 4; // Claude 동시 호출 제한

export async function POST(req: Request) {
  let contents: string[];
  try {
    const body = await req.json();
    contents = Array.isArray(body?.contents)
      ? Array.from(
          new Set(
            body.contents
              .map((c: unknown) => (typeof c === "string" ? c.trim() : ""))
              .filter((c: string) => c.length > 0 && c.length <= 4000),
          ),
        )
      : [];
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  if (contents.length === 0) {
    return NextResponse.json(
      { error: "분석할 본문이 없습니다." },
      { status: 400 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "서버에 ANTHROPIC_API_KEY 가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const truncated = contents.length > MAX_BATCH;
  const batch = contents.slice(0, MAX_BATCH);
  const supabase = getSupabase();

  let ok = 0;
  let failed = 0;
  let saved = 0;
  const results: BatchItemResult[] = new Array(batch.length);

  // 동시성 제한 풀 (결과는 index 로 보존해 순서 유지)
  let cursor = 0;
  async function worker() {
    while (cursor < batch.length) {
      const index = cursor++;
      const content = batch[index];
      try {
        const metrics = computeMetrics(content);
        const analysis = await analyzeMessage(content);
        ok++;
        if (supabase) {
          // 같은 본문은 content_hash 로 dedup — 재분석 시 최신 결과로 갱신(upsert).
          const { error } = await supabase.from(ANALYSES_TABLE).upsert(
            {
              content,
              content_hash: contentHash(content),
              classification: analysis.classification,
              confidence: analysis.confidence,
              topic: analysis.topic,
              keywords: analysis.keywords,
              typo_count: analysis.typos.length,
              byte_length: metrics.byteLength,
              result: analysis,
            },
            { onConflict: "content_hash" },
          );
          if (!error) saved++;
        }
        results[index] = {
          index,
          content,
          ok: true,
          analysis,
          metrics,
        };
      } catch (err) {
        failed++;
        console.error("[analyze/batch] 1건 실패:", err);
        results[index] = {
          index,
          content,
          ok: false,
          error: "분석 실패",
        };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, batch.length) }, worker),
  );

  return NextResponse.json({
    requested: contents.length,
    processed: batch.length,
    ok,
    failed,
    saved,
    truncated,
    maxBatch: MAX_BATCH,
    results,
  });
}
