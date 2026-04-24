-- ============================================
-- Brew Log - Supabase 테이블 스키마
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- ============================================

-- 원두 테이블
create table if not exists beans (
  id            uuid        default gen_random_uuid() primary key,
  brand         text        not null,
  name          text        not null,
  type          text        not null check (type in ('single_origin', 'blend')),
  origin        text,
  roast_level   text        not null check (roast_level in ('light', 'medium_light', 'medium', 'medium_dark', 'dark')),
  capacity_g    integer,
  price         integer,
  roast_date    date,
  flavor_tags   text[]      default '{}',
  description   text,
  recommended_recipe jsonb  default '{}',
  is_exhausted  boolean     default false,
  created_at    timestamptz default now()
);

-- 추출 기록 테이블
create table if not exists extractions (
  id              uuid        default gen_random_uuid() primary key,
  bean_id         uuid        references beans(id) on delete cascade,
  extracted_at    timestamptz default now(),
  drink_type      text        not null,
  shot_dose       numeric,
  shot_yield      numeric,
  shot_time       integer,
  drink_water     numeric,
  drink_milk      numeric,
  has_ice         boolean     default false,
  taste_overall   integer     check (taste_overall between 1 and 5),
  taste_acidity   integer     check (taste_acidity between 1 and 5),
  taste_bitterness integer    check (taste_bitterness between 1 and 5),
  taste_body      integer     check (taste_body between 1 and 5),
  taste_sweetness integer     check (taste_sweetness between 1 and 5),
  memo            text,
  is_best         boolean     default false,
  created_at      timestamptz default now()
);

-- 머신 테이블
create table if not exists machine (
  id            uuid        default gen_random_uuid() primary key,
  name          text,
  purchase_date date,
  notes         text,
  created_at    timestamptz default now()
);

-- open_date 컬럼 추가 (이미 테이블이 존재하는 경우 아래 ALTER 실행)
alter table beans add column if not exists open_date date;

-- RLS (Row Level Security) 활성화
alter table beans       enable row level security;
alter table extractions enable row level security;
alter table machine     enable row level security;

-- 개인 앱이므로 anon 키로 전체 접근 허용
-- (실서비스에서는 인증 기반 정책으로 교체 권장)
create policy "public_all" on beans       for all using (true) with check (true);
create policy "public_all" on extractions for all using (true) with check (true);
create policy "public_all" on machine     for all using (true) with check (true);
