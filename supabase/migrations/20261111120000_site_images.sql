-- 網站固定位置的圖片（首頁主視覺、服務項目示意照片…），後台可自行更換。
-- 每個位置一筆，slot 是位置代碼（例如 home-hero、service-residential），位置清單定義在 src/lib/site-images.ts。
-- 照片檔放在 project-images bucket 的 site/ 資料夾，沿用既有的 Storage 權限（公開讀、管理者寫）。
-- 執行方式：Supabase Dashboard → SQL Editor → 貼上整份 → Run。可重複執行。

create table if not exists public.site_images (
  slot text primary key check (slot ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  image_path text not null,
  alt_text text not null default '',
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  updated_at timestamptz not null default now()
);

drop trigger if exists site_images_set_updated_at on public.site_images;
create trigger site_images_set_updated_at
  before update on public.site_images
  for each row execute function public.set_updated_at();

alter table public.site_images enable row level security;

drop policy if exists "site_images: 所有人可讀" on public.site_images;
create policy "site_images: 所有人可讀" on public.site_images
  for select to anon, authenticated
  using (true);

drop policy if exists "site_images: 管理者新增" on public.site_images;
create policy "site_images: 管理者新增" on public.site_images
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "site_images: 管理者修改" on public.site_images;
create policy "site_images: 管理者修改" on public.site_images
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "site_images: 管理者刪除" on public.site_images;
create policy "site_images: 管理者刪除" on public.site_images
  for delete to authenticated
  using ((select public.is_admin()));
