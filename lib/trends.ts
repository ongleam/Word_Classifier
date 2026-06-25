// 트렌드 집계 — DB 전체(또는 임의의 분석 레코드 배열)에서 통계를 낸다.
import type {
  AnalysisResult,
  Classification,
  HistoryItem,
  TrendData,
} from "@/lib/types";

// 트렌드 집계의 입력 1건 (DB 행 또는 세션 분석 결과를 정규화한 형태)
export interface TrendItem {
  id: string;
  created_at: string;
  content: string;
  classification: Classification;
  topic: string;
  confidence: number;
  typo_count: number;
  byte_length: number;
  keywords: string[];
  result?: AnalysisResult; // 펼쳤을 때 보여줄 상세 (있으면 인라인)
}

const HISTORY_LIMIT = 200; // 내역 목록에 노출할 최신 건수 (집계 수치는 전체 기준)

export function computeTrendFromItems(items: TrendItem[]): TrendData {
  const adCount = items.filter((e) => e.classification === "광고성").length;
  const infoCount = items.length - adCount;

  // 키워드 빈도
  const kwMap = new Map<string, number>();
  for (const e of items) {
    for (const k of e.keywords ?? []) {
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
  for (const e of items) {
    const t = (e.topic ?? "미분류").trim() || "미분류";
    topicMap.set(t, (topicMap.get(t) ?? 0) + 1);
  }
  const topicDistribution = [...topicMap.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);

  // 최신순 내역 (목록은 최신 HISTORY_LIMIT 건까지만)
  const history: HistoryItem[] = [...items]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, HISTORY_LIMIT)
    .map((e) => ({
      id: e.id,
      created_at: e.created_at,
      content: e.content,
      classification: e.classification,
      topic: e.topic ?? "미분류",
      confidence: e.confidence ?? 0,
      typo_count: e.typo_count ?? 0,
      byte_length: e.byte_length ?? 0,
      keywords: Array.isArray(e.keywords) ? e.keywords : [],
      result: e.result,
    }));

  return {
    total: items.length,
    adCount,
    infoCount,
    adRatio: items.length ? adCount / items.length : 0,
    topKeywords,
    topicDistribution,
    history,
  };
}
