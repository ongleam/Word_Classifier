import { NextResponse } from "next/server";
import { getSupabase, ANALYSES_TABLE } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "저장소가 설정되지 않았습니다." },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from(ANALYSES_TABLE)
    .select("id, created_at, content, result")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "해당 분석을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: data.id,
    created_at: data.created_at,
    content: data.content,
    analysis: data.result, // 전체 AnalysisResult
  });
}
