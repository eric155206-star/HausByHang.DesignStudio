-- 4c 文章：後台用所見即所得編輯器撰寫，前台 /blog 顯示已發佈的文章。
-- content 存編輯器的結構化內容（JSON），前台依結構畫出標題、段落、清單、圖片，不直接輸出 HTML。
-- 文章圖片放在 project-images bucket 的 posts/<文章 id>/ 資料夾，沿用既有的 Storage 權限（公開讀、管理者寫）。
-- 執行方式：Supabase Dashboard → SQL Editor → 貼上整份 → Run。可重複執行。

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text,
  cover_image_path text,
  cover_width integer check (cover_width > 0),
  cover_height integer check (cover_height > 0),
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  is_published boolean not null default false,
  published_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 發佈時一定要有發佈日期
  constraint posts_published_needs_date check (not is_published or published_on is not null)
);

create index if not exists posts_published_order_idx
  on public.posts (is_published, published_on desc, created_at desc);

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

alter table public.posts enable row level security;

drop policy if exists "posts: 訪客讀已發佈" on public.posts;
create policy "posts: 訪客讀已發佈" on public.posts
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));

drop policy if exists "posts: 管理者新增" on public.posts;
create policy "posts: 管理者新增" on public.posts
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "posts: 管理者修改" on public.posts;
create policy "posts: 管理者修改" on public.posts
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "posts: 管理者刪除" on public.posts;
create policy "posts: 管理者刪除" on public.posts
  for delete to authenticated
  using ((select public.is_admin()));

notify pgrst, 'reload schema';
