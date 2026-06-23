import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 서버 전용 Supabase 클라이언트.
 * service_role 키를 사용하므로 절대 클라이언트 컴포넌트에서 import 하지 말 것.
 * 환경 변수가 없으면 null 을 반환해, Supabase 미설정 상태에서도
 * 분석(Claude) 기능은 동작하도록 한다 (저장/트렌드만 비활성).
 */
let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  // 2025 신규 키 체계: sb_secret_... (구 service_role JWT 대체).
  // 레거시 키도 fallback 으로 허용.
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  cached = createClient(url, key, {
    auth: { persistSession: false },
    global: {
      // Next.js 가 route handler 내부 fetch 를 기본 캐싱하므로, Supabase REST
      // 호출이 옛 응답을 반환하는 문제를 막기 위해 항상 no-store 로 강제한다.
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  return cached;
}

export const ANALYSES_TABLE = "analyses";
