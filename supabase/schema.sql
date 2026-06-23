-- NH SMS 대시보드 — Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣어 실행하세요.

create table if not exists public.analyses (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  content      text        not null,
  classification text      not null,           -- '광고성' | '정보성'
  confidence   integer     not null default 0, -- 0–100
  topic        text,                           -- 주제 카테고리
  keywords     jsonb       not null default '[]'::jsonb,
  typo_count   integer     not null default 0,
  byte_length  integer     not null default 0,
  result       jsonb       not null default '{}'::jsonb -- 전체 분석 페이로드
);

-- 트렌드 조회용 인덱스
create index if not exists analyses_created_at_idx
  on public.analyses (created_at desc);

create index if not exists analyses_classification_idx
  on public.analyses (classification);

-- RLS: 본 PoC 는 서버(service_role)에서만 접근하므로 RLS 를 켜고
-- 익명/일반 키의 직접 접근을 차단합니다. service_role 은 RLS 를 우회합니다.
alter table public.analyses enable row level security;
