import { NextResponse } from "next/server";
import { getSupabase, ANALYSES_TABLE } from "@/lib/supabase";
import { computeTrendFromItems, type TrendItem } from "@/lib/trends";
import type { AnalysisResult, Classification, TrendData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // 항상 최신 DB 상태로 집계

const EMPTY: TrendData = {
  total: 0,
  adCount: 0,
  infoCount: 0,
  adRatio: 0,
  topKeywords: [],
  topicDistribution: [],
  history: [],
};

// Supabase REST 기본 상한(1000)보다 넉넉히. PoC 규모에선 충분.
const MAX_ROWS = 5000;

interface Row {
  id: string;
  created_at: string;
  content: string;
  classification: string;
  topic: string | null;
  confidence: number | null;
  typo_count: number | null;
  byte_length: number | null;
  keywords: unknown;
  result: unknown;
}

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    // Supabase 미설정 — 빈 트렌드로 응답 (분석 기능은 별도로 동작)
    return NextResponse.json({ ...EMPTY, configured: false });
  }

  const { data, error } = await supabase
    .from(ANALYSES_TABLE)
    .select(
      "id, created_at, content, classification, topic, confidence, typo_count, byte_length, keywords, result",
    )
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  if (error) {
    console.error("[trends] Supabase 조회 실패:", error.message);
    return NextResponse.json(
      { error: "트렌드 조회 중 오류가 발생했습니다." },
      { status: 502 },
    );
  }

  const items: TrendItem[] = (data as Row[]).map((r) => ({
    id: r.id,
    created_at: r.created_at,
    content: r.content,
    classification: (r.classification === "광고성"
      ? "광고성"
      : "정보성") as Classification,
    topic: r.topic ?? "미분류",
    confidence: r.confidence ?? 0,
    typo_count: r.typo_count ?? 0,
    byte_length: r.byte_length ?? 0,
    keywords: Array.isArray(r.keywords) ? (r.keywords as string[]) : [],
    result: (r.result && typeof r.result === "object"
      ? (r.result as AnalysisResult)
      : undefined),
  }));

  return NextResponse.json({ ...computeTrendFromItems(items), configured: true });
}
