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
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  cached = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cached;
}

export const ANALYSES_TABLE = "analyses";
