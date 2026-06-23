import type { MessageMetrics } from "./types";

const SMS_BYTE_LIMIT = 90; // 표준 SMS 한도 (초과 시 LMS)

/**
 * 한국 SMS 바이트 계산.
 * EUC-KR 기준: 한글/한자 등 멀티바이트 문자는 2바이트, ASCII 는 1바이트로 본다.
 */
export function computeMetrics(text: string): MessageMetrics {
  let byteLength = 0;
  for (const ch of text) {
    byteLength += ch.charCodeAt(0) > 0x7f ? 2 : 1;
  }
  return {
    charCount: [...text].length,
    byteLength,
    messageType: byteLength > SMS_BYTE_LIMIT ? "LMS" : "SMS",
    byteLimitSMS: SMS_BYTE_LIMIT,
  };
}
