// 이번 세션에서 분석한 결과만으로 트렌드를 집계한다.
// DB 전체(과거·중복 포함) 대신 클라이언트 메모리의 SessionEntry[] 만 사용.
import type { SessionEntry, TrendData } from "@/lib/types";

export function computeTrend(entries: SessionEntry[]): TrendData {
  const adCount = entries.filter(
    (e) => e.analysis.classification === "광고성",
  ).length;
  const infoCount = entries.length - adCount;

  // 키워드 빈도
  const kwMap = new Map<string, number>();
  for (const e of entries) {
    for (const k of e.analysis.keywords ?? []) {
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
  for (const e of entries) {
    const t = (e.analysis.topic ?? "미분류").trim() || "미분류";
    topicMap.set(t, (topicMap.get(t) ?? 0) + 1);
  }
  const topicDistribution = [...topicMap.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);

  // 최신순 내역 (상세는 인라인 보유 — 별도 조회 불필요)
  const history = [...entries]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((e) => ({
      id: e.id,
      created_at: e.created_at,
      content: e.content,
      classification: e.analysis.classification,
      topic: e.analysis.topic ?? "미분류",
      confidence: e.analysis.confidence ?? 0,
      typo_count: e.analysis.typos?.length ?? 0,
      byte_length: e.metrics.byteLength,
      keywords: Array.isArray(e.analysis.keywords) ? e.analysis.keywords : [],
      result: e.analysis,
    }));

  return {
    total: entries.length,
    adCount,
    infoCount,
    adRatio: entries.length ? adCount / entries.length : 0,
    topKeywords,
    topicDistribution,
    history,
  };
}
