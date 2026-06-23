import { NextResponse } from "next/server";
import { analyzeMessage } from "@/lib/analyze";
import { computeMetrics } from "@/lib/sms";
import { getSupabase, ANALYSES_TABLE } from "@/lib/supabase";
import type { AnalyzeResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60; // Claude 호출 여유 (Vercel)

export async function POST(req: Request) {
  let content: string;
  try {
    const body = await req.json();
    content = typeof body?.content === "string" ? body.content.trim() : "";
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  if (!content) {
    return NextResponse.json({ error: "본문이 비어 있습니다." }, { status: 400 });
  }
  if (content.length > 4000) {
    return NextResponse.json(
      { error: "본문이 너무 깁니다 (최대 4000자)." },
      { status: 400 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "서버에 ANTHROPIC_API_KEY 가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const metrics = computeMetrics(content);

  let analysis;
  try {
    analysis = await analyzeMessage(content);
  } catch (err) {
    console.error("[analyze] Claude 분석 실패:", err);
    return NextResponse.json(
      { error: "메시지 분석 중 오류가 발생했습니다." },
      { status: 502 },
    );
  }

  // Supabase 저장 (미설정/실패해도 분석 결과는 반환)
  let saved = false;
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from(ANALYSES_TABLE).insert({
      content,
      classification: analysis.classification,
      confidence: analysis.confidence,
      topic: analysis.topic,
      keywords: analysis.keywords,
      typo_count: analysis.typos.length,
      byte_length: metrics.byteLength,
      result: analysis,
    });
    if (error) {
      console.error("[analyze] Supabase 저장 실패:", error.message);
    } else {
      saved = true;
    }
  }

  const payload: AnalyzeResponse = { metrics, analysis, saved };
  return NextResponse.json(payload);
}
