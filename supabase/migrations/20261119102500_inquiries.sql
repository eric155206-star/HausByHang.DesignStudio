-- 4b 詢問單：/contact 表單送出的資料。
-- 含姓名、電話等個資，所以對外完全關閉：沒有任何匿名或一般登入者的新增／讀取權限，
-- 只有網站伺服器（secret key，會略過 RLS）能寫入，管理者登入後台才能讀、改狀態、刪除。
-- ip_hash 是來源 IP 加鹽雜湊後的指紋，只用來做頻率限制，不存原始 IP。
-- 執行方式：Supabase Dashboard → SQL Editor → 貼上整份 → Run。可重複執行。

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  line_id text,
  email text,
  space_type text not null,
  house_condition text not null,
  house_type text,
  house_age numeric(5, 1),
  region text not null,
  area_ping numeric(7, 1),
  budget text not null,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  admin_note text,
  ip_hash text,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inquiries_status_created_idx on public.inquiries (status, created_at desc);
create index if not exists inquiries_ip_created_idx on public.inquiries (ip_hash, created_at desc);

drop trigger if exists inquiries_set_updated_at on public.inquiries;
create trigger inquiries_set_updated_at
  before update on public.inquiries
  for each row execute function public.set_updated_at();

alter table public.inquiries enable row level security;

-- 故意不建立 insert policy：訪客與一般登入者都不能直接寫入，只能走網站伺服器。
drop policy if exists "inquiries: 管理者可讀" on public.inquiries;
create policy "inquiries: 管理者可讀" on public.inquiries
  for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "inquiries: 管理者修改" on public.inquiries;
create policy "inquiries: 管理者修改" on public.inquiries
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "inquiries: 管理者刪除" on public.inquiries;
create policy "inquiries: 管理者刪除" on public.inquiries
  for delete to authenticated
  using ((select public.is_admin()));

notify pgrst, 'reload schema';
