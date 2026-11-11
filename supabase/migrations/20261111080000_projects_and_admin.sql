-- 4a 作品管理：後台白名單、作品、作品照片、照片儲存空間
-- 對應規格文件「沆設計官網 規格與資料表 v1」。
-- 執行方式：Supabase Dashboard → SQL Editor → 貼上整份 → Run。可重複執行（已存在的物件會略過）。

-- ─────────────────────────────────────────────
-- 共用：updated_at 自動更新
-- ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────
-- admin_users 後台白名單
-- 只有這張表裡的 Email 能進後台。新增管理員要在 SQL Editor 手動 insert。
-- ─────────────────────────────────────────────
create table if not exists public.admin_users (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- 目前登入者是否在白名單內。security definer 讓函式能讀 admin_users，
-- 但 admin_users 本身對一般使用者是關閉的。
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admin_users: 管理者可讀" on public.admin_users;
create policy "admin_users: 管理者可讀" on public.admin_users
  for select to authenticated
  using ((select public.is_admin()));

-- ─────────────────────────────────────────────
-- projects 作品
-- ─────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'project_category') then
    create type public.project_category as enum ('residential', 'commercial');
  end if;
end $$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- 英文小標，例如 Banqiao · Residence（規格文件以外新增，作品內頁標題上方使用）
  subtitle_en text,
  category public.project_category not null default 'residential',
  is_old_house boolean not null default false,
  area_ping numeric(7, 1) check (area_ping is null or area_ping > 0),
  location text,
  completed_year integer check (completed_year is null or completed_year between 1990 and 2100),
  summary text,
  description text,
  cover_image_path text,
  cover_alt text,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 發佈前一定要有封面與替代文字
  constraint projects_published_needs_cover check (
    not is_published or (cover_image_path is not null and coalesce(trim(cover_alt), '') <> '')
  )
);

create index if not exists projects_published_order_idx
  on public.projects (is_published, sort_order, completed_year desc);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

drop policy if exists "projects: 訪客讀已發佈" on public.projects;
create policy "projects: 訪客讀已發佈" on public.projects
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));

drop policy if exists "projects: 管理者新增" on public.projects;
create policy "projects: 管理者新增" on public.projects
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "projects: 管理者修改" on public.projects;
create policy "projects: 管理者修改" on public.projects
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "projects: 管理者刪除" on public.projects;
create policy "projects: 管理者刪除" on public.projects
  for delete to authenticated
  using ((select public.is_admin()));

-- ─────────────────────────────────────────────
-- project_images 作品照片
-- ─────────────────────────────────────────────
create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  image_path text not null,
  alt_text text not null default '',
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_images_project_order_idx
  on public.project_images (project_id, sort_order);

alter table public.project_images enable row level security;

drop policy if exists "project_images: 訪客讀已發佈作品的照片" on public.project_images;
create policy "project_images: 訪客讀已發佈作品的照片" on public.project_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (p.is_published or (select public.is_admin()))
    )
  );

drop policy if exists "project_images: 管理者新增" on public.project_images;
create policy "project_images: 管理者新增" on public.project_images
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "project_images: 管理者修改" on public.project_images;
create policy "project_images: 管理者修改" on public.project_images
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "project_images: 管理者刪除" on public.project_images;
create policy "project_images: 管理者刪除" on public.project_images
  for delete to authenticated
  using ((select public.is_admin()));

-- ─────────────────────────────────────────────
-- Storage：project-images 公開讀取，只有管理者能上傳、刪除
-- 單檔上限 15 MB；瀏覽器端會先壓到長邊 2400px，正常只有幾百 KB。
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-images', 'project-images', true, 15728640, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "project-images: 管理者上傳" on storage.objects;
create policy "project-images: 管理者上傳" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-images' and (select public.is_admin()));

drop policy if exists "project-images: 管理者修改" on storage.objects;
create policy "project-images: 管理者修改" on storage.objects
  for update to authenticated
  using (bucket_id = 'project-images' and (select public.is_admin()));

drop policy if exists "project-images: 管理者刪除" on storage.objects;
create policy "project-images: 管理者刪除" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-images' and (select public.is_admin()));
