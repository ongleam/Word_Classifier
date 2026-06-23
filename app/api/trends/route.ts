import { NextResponse } from "next/server";
import { getSupabase, ANALYSES_TABLE } from "@/lib/supabase";
import type { SavedAnalysis, TrendData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    // Supabase 미설정 — 빈 트렌드 반환 (대시보드는 안내 문구 표시)
    return NextResponse.json({ configured: false, trend: emptyTrend() });
  }

  const { data, error } = await supabase
    .from(ANALYSES_TABLE)
    .select(
      "id, created_at, content, classification, topic, keywords, confidence, typo_count, byte_length",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[trends] 조회 실패:", error.message);
    return NextResponse.json(
      { configured: true, error: "트렌드 조회 실패", trend: emptyTrend() },
      { status: 502 },
    );
  }

  const rows = (data ?? []) as Pick<
    SavedAnalysis,
    | "id"
    | "created_at"
    | "content"
    | "classification"
    | "topic"
    | "keywords"
    | "confidence"
    | "typo_count"
    | "byte_length"
  >[];

  const adCount = rows.filter((r) => r.classification === "광고성").length;
  const infoCount = rows.length - adCount;

  // 키워드 빈도
  const kwMap = new Map<string, number>();
  for (const r of rows) {
    for (const k of r.keywords ?? []) {
      const key = String(k).trim();
      if (key) kwMap.set(key, (kwMap.get(key) ?? 0) + 1);
    }
  }
  const topKeywords = [...kwMap.entries()]
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // 주제 분포
  const topicMap = new Map<string, number>();
  for (const r of rows) {
    const t = (r.topic ?? "미분류").trim() || "미분류";
    topicMap.set(t, (topicMap.get(t) ?? 0) + 1);
  }
  const topicDistribution = [...topicMap.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);

  const trend: TrendData = {
    total: rows.length,
    adCount,
    infoCount,
    adRatio: rows.length ? adCount / rows.length : 0,
    topKeywords,
    topicDistribution,
    history: rows.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      content: r.content.slice(0, 200),
      classification: r.classification,
      topic: r.topic ?? "미분류",
      confidence: r.confidence ?? 0,
      typo_count: r.typo_count ?? 0,
      byte_length: r.byte_length ?? 0,
      keywords: Array.isArray(r.keywords) ? r.keywords : [],
    })),
  };

  return NextResponse.json({ configured: true, trend });
}

function emptyTrend(): TrendData {
  return {
    total: 0,
    adCount: 0,
    infoCount: 0,
    adRatio: 0,
    topKeywords: [],
    topicDistribution: [],
    history: [],
  };
}
