/**
 * 업로드된 파일을 메시지 배열로 분해하는 통합 진입점.
 * - .json 이거나 내용이 JSON 으로 파싱되면 JSON 경로 (권장)
 * - 그 외에는 CSV/줄 단위 경로
 */
export function parseUpload(text: string, fileName = ""): string[] {
  const looksJson =
    /\.json$/i.test(fileName) || /^\s*[[{]/.test(text);
  if (looksJson) {
    const fromJson = parseJsonMessages(text);
    if (fromJson) return fromJson;
  }
  return parseMessages(text);
}

/**
 * JSON 본문에서 메시지 문자열들을 추출한다. 파싱 실패 시 null.
 * 지원 형태:
 *   - ["문구1", "문구2", ...]
 *   - [{ "content": "..." }, { "message": "..." }, ...]
 *   - { "messages": [ ... ] } / { "contents": [...] } / { "items": [...] } ...
 *   - 단일 문자열 / 단일 객체
 */
export function parseJsonMessages(text: string): string[] | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  return extractMessages(data);
}

const ARRAY_KEYS = ["messages", "contents", "items", "data", "rows", "list"];
const FIELD_KEYS = ["content", "message", "text", "body", "sms", "msg", "본문"];

function extractMessages(data: unknown): string[] {
  if (typeof data === "string") {
    const s = data.trim();
    return s ? [s] : [];
  }
  if (Array.isArray(data)) {
    return data.map(itemToMessage).filter(Boolean);
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ARRAY_KEYS) {
      if (Array.isArray(obj[key])) {
        return (obj[key] as unknown[]).map(itemToMessage).filter(Boolean);
      }
    }
    const single = itemToMessage(data);
    return single ? [single] : [];
  }
  return [];
}

function itemToMessage(item: unknown): string {
  if (typeof item === "string") return item.trim();
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    for (const key of FIELD_KEYS) {
      if (typeof obj[key] === "string") return (obj[key] as string).trim();
    }
  }
  return "";
}

/**
 * 업로드/드롭된 텍스트를 "여러 건의 메시지"로 분해한다.
 *
 * - RFC4180 풍의 CSV 파싱: 따옴표로 감싼 필드 안의 줄바꿈/콤마는 보존한다
 *   (NH 발송문은 여러 줄이라 따옴표로 감싸 한 셀에 담기는 경우가 많음).
 * - 각 레코드의 첫 번째 컬럼을 메시지 본문으로 사용한다.
 * - 따옴표가 전혀 없으면 CSV 가 아닌 일반 텍스트로 보고, 줄 단위로 분해한다.
 *   (단, 결과가 1건이면 전체를 단일 메시지로 본다)
 */
export function parseMessages(text: string): string[] {
  const t = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!t) return [];

  const hasQuotes = t.includes('"');

  if (hasQuotes) {
    return parseCsvFirstColumn(t);
  }

  // 따옴표 없는 일반 텍스트: 줄 단위 분해
  const lines = t
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  // 한 줄(또는 분해 불가)이면 전체를 단일 메시지로
  return lines.length > 1 ? lines : [t];
}

function parseCsvFirstColumn(t: string): string[] {
  const records: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQuotes) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        records.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  row.push(field);
  records.push(row);

  return records.map((r) => (r[0] ?? "").trim()).filter(Boolean);
}
