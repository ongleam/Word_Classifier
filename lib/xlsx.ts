// xlsx(엑셀) 파일을 메시지 배열로 분해한다. (클라이언트 전용 — SheetJS 사용)
import * as XLSX from "xlsx";

/**
 * .xlsx / .xls 파일(ArrayBuffer)을 메시지 문자열 배열로 변환한다.
 * - 모든 시트를 순회한다.
 * - 본문 컬럼을 추정한다:
 *   1) 헤더에 content/message/text/body/sms/본문/문구/내용 류가 있으면 그 컬럼,
 *   2) 없으면 각 행의 첫 번째(비어있지 않은) 셀.
 * - 추정된 헤더 행은 본문에서 제외한다.
 */
export function parseXlsx(buf: ArrayBuffer): string[] {
  const wb = XLSX.read(buf, { type: "array" });
  const messages: string[] = [];

  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    if (!sheet) continue;
    // 행 단위 2차원 배열 (빈 셀 포함, 문자열화)
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
      raw: false,
    });
    if (rows.length === 0) continue;

    const { colIndex, headerRow } = detectContentColumn(rows);

    rows.forEach((row, i) => {
      if (i === headerRow) return; // 헤더 행 제외
      const cell =
        colIndex >= 0 ? row[colIndex] : row.find((c) => String(c).trim());
      const text = cell == null ? "" : String(cell).trim();
      if (text) messages.push(text);
    });
  }

  return messages;
}

const HEADER_HINTS = [
  "content",
  "message",
  "text",
  "body",
  "sms",
  "msg",
  "본문",
  "문구",
  "내용",
  "메시지",
];

/** 헤더 행에서 본문 컬럼 인덱스를 추정. 못 찾으면 colIndex=-1, headerRow=-1 */
function detectContentColumn(rows: unknown[][]): {
  colIndex: number;
  headerRow: number;
} {
  const first = rows[0] ?? [];
  for (let c = 0; c < first.length; c++) {
    const head = String(first[c]).trim().toLowerCase();
    if (HEADER_HINTS.some((h) => head === h || head.includes(h))) {
      return { colIndex: c, headerRow: 0 };
    }
  }
  return { colIndex: -1, headerRow: -1 };
}
