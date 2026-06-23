import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult } from "./types";

const client = new Anthropic(); // ANTHROPIC_API_KEY 를 환경에서 읽음

const SYSTEM_PROMPT = `당신은 NH농협의 마케팅 SMS/LMS 발송 본문을 발송 전에 점검하는 한국어 검수 전문가입니다.
대한민국 정보통신망법(광고성 정보 전송) 규정을 숙지하고 있습니다.

주어진 메시지 본문을 분석하여 아래 JSON 스키마에 정확히 맞는 결과만 출력하세요.
설명 문장이나 코드블록(\`\`\`) 없이 순수 JSON 객체만 출력합니다.

규정 참고:
- 광고성 정보는 본문 맨 앞에 "(광고)" 표기가 있어야 합니다.
- 광고성 정보는 무료수신거부 방법(예: 무료거부 080-xxx-xxxx)이 포함되어야 합니다.
- 발신 주체(브랜드/기관명, 예: NH농협, NH투자증권 등)가 명시되어야 합니다.
- 정보성 메시지(거래내역, 본인인증, 배송, 공지 등)는 위 표기 의무 대상이 아닙니다.

JSON 스키마:
{
  "classification": "광고성" 또는 "정보성",
  "confidence": 0~100 정수,
  "reasoning": "분류 근거 한국어 1~2문장",
  "topic": "주제 카테고리 (예: 대출, 예적금, 카드, 보험, 이벤트, 공지, 보안, 본인인증)",
  "keywords": ["핵심 키워드 3~7개"],
  "tone": "어조 (예: 친근함, 공식적, 긴급, 권유)",
  "summary": "본문 한 줄 요약",
  "typos": [
    { "original": "잘못된 표현", "suggestion": "교정안", "reason": "오타/맞춤법/띄어쓰기" }
  ],
  "compliance": {
    "needsAdPrefix": true/false,
    "hasAdPrefix": true/false,
    "hasOptOut": true/false,
    "hasSender": true/false,
    "issues": ["표기 위반 또는 보완 필요 항목"]
  }
}

오탈자가 없으면 typos 는 빈 배열로 둡니다. 광고성이 아니면 needsAdPrefix 는 false 입니다.`;

/** 모델 응답에서 JSON 본문만 추출 (혹시 모를 코드펜스/주변 텍스트 방어) */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text.trim();
}

export async function analyzeMessage(content: string): Promise<AnalysisResult> {
  // adaptive thinking + effort 는 claude-opus-4-8 API 에서 지원되지만
  // SDK 0.69.0 타입에는 아직 반영되지 않아, 런타임 전송을 위해 추가 필드로 주입한다.
  const extraParams = {
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
  } as object;

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `다음 마케팅 발송 본문을 분석하세요:\n\n"""\n${content}\n"""`,
      },
    ],
    ...extraParams,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("모델이 텍스트 응답을 반환하지 않았습니다.");
  }

  const parsed = JSON.parse(extractJson(textBlock.text)) as AnalysisResult;

  // 안전 기본값 보정
  return {
    classification: parsed.classification === "광고성" ? "광고성" : "정보성",
    confidence: clampNumber(parsed.confidence, 0, 100),
    reasoning: parsed.reasoning ?? "",
    topic: parsed.topic ?? "미분류",
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : [],
    tone: parsed.tone ?? "",
    summary: parsed.summary ?? "",
    typos: Array.isArray(parsed.typos) ? parsed.typos : [],
    compliance: {
      needsAdPrefix: !!parsed.compliance?.needsAdPrefix,
      hasAdPrefix: !!parsed.compliance?.hasAdPrefix,
      hasOptOut: !!parsed.compliance?.hasOptOut,
      hasSender: !!parsed.compliance?.hasSender,
      issues: Array.isArray(parsed.compliance?.issues)
        ? parsed.compliance.issues
        : [],
    },
  };
}

function clampNumber(n: unknown, min: number, max: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (Number.isNaN(v)) return 0;
  return Math.max(min, Math.min(max, Math.round(v)));
}
