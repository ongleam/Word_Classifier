-- NH SMS 대시보드 — Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣어 실행하세요.
-- ⚠️ 이 스크립트는 analyses 테이블을 DROP 후 재생성합니다(데이터 전체 초기화).

drop table if exists public.analyses cascade;

create table public.analyses (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  content      text        not null,
  content_hash text        not null,           -- 본문 md5 (중복 제거 키)
  classification text      not null,           -- '광고성' | '정보성'
  confidence   integer     not null default 0, -- 0–100
  topic        text,                           -- 주제 카테고리
  keywords     jsonb       not null default '[]'::jsonb,
  typo_count   integer     not null default 0,
  byte_length  integer     not null default 0,
  result       jsonb       not null default '{}'::jsonb -- 전체 분석 페이로드
);

-- 중복 제거(Dedup) 키: 같은 본문은 1행만 유지. upsert 의 onConflict 대상.
create unique index analyses_content_hash_key
  on public.analyses (content_hash);

-- 트렌드 조회용 인덱스
create index analyses_created_at_idx
  on public.analyses (created_at desc);

create index analyses_classification_idx
  on public.analyses (classification);

-- RLS: 본 PoC 는 서버(service_role)에서만 접근하므로 RLS 를 켜고
-- 익명/일반 키의 직접 접근을 차단합니다. service_role 은 RLS 를 우회합니다.
alter table public.analyses enable row level security;
