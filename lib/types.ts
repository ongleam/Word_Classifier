// NH SMS 대시보드 공용 타입

export type Classification = "광고성" | "정보성";

export interface Typo {
  original: string; // 본문에서 잘못 쓰인 표현
  suggestion: string; // 교정 제안
  reason: string; // 사유 (맞춤법/띄어쓰기/오타 등)
}

export interface Compliance {
  needsAdPrefix: boolean; // 광고성이라 (광고) 표기가 필요한지
  hasAdPrefix: boolean; // 본문에 (광고) 가 있는지
  hasOptOut: boolean; // 무료수신거부 안내가 있는지
  hasSender: boolean; // 발신주체(브랜드/기관) 표기가 있는지
  issues: string[]; // 정보통신망법 등 표기 위반 항목
}

export interface AnalysisResult {
  classification: Classification;
  confidence: number; // 0–100
  reasoning: string;
  topic: string; // 주제 카테고리 (예: 대출, 예적금, 카드, 이벤트, 공지, 보안)
  keywords: string[]; // 핵심 키워드
  tone: string; // 어조 (예: 친근함, 공식적, 긴급)
  summary: string; // 한 줄 요약
  typos: Typo[];
  compliance: Compliance;
}

// 바이트/세그먼트 등 결정적으로 계산되는 메트릭 (모델 호출 불필요)
export interface MessageMetrics {
  charCount: number;
  byteLength: number; // 한글 2바이트 기준
  messageType: "SMS" | "LMS"; // 90바이트 초과 시 LMS
  byteLimitSMS: number; // 90
}

export interface AnalyzeResponse {
  metrics: MessageMetrics;
  analysis: AnalysisResult;
  saved: boolean; // Supabase 저장 성공 여부
}

// Supabase 에 적재되는 레코드 + 트렌드 집계 응답
export interface SavedAnalysis {
  id: string;
  created_at: string;
  content: string;
  classification: Classification;
  confidence: number;
  topic: string;
  keywords: string[];
  typo_count: number;
  byte_length: number;
  result: AnalysisResult;
}

export interface HistoryItem {
  id: string;
  created_at: string;
  content: string;
  classification: Classification;
  topic: string;
  confidence: number;
  typo_count: number;
  byte_length: number;
  keywords: string[];
}

export interface TrendData {
  total: number;
  adCount: number; // 광고성 건수
  infoCount: number; // 정보성 건수
  adRatio: number; // 광고성 비율 (0–1)
  topKeywords: { keyword: string; count: number }[];
  topicDistribution: { topic: string; count: number }[];
  history: HistoryItem[]; // 지금까지 분석한 전체 내역 (최신순)
}
