import type { Typo } from "@/lib/types";

/**
 * 오탈자 교정안을 본문에 일괄 적용해 "교정된 글"을 만든다.
 * 각 typo 의 original 을 suggestion 으로 치환한다(정확히 일치하는 모든 부분).
 * 본문에서 찾지 못하는 original 은 건너뛴다(best-effort).
 */
export function applyTypoCorrections(content: string, typos: Typo[]): string {
  let out = content;
  for (const t of typos) {
    const from = (t.original ?? "").trim();
    const to = t.suggestion ?? "";
    if (!from || from === to) continue;
    out = out.split(from).join(to);
  }
  return out;
}
