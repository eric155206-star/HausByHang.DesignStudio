-- 後台成員邀請：白名單加上姓名與邀請人，讓「成員」頁能顯示是誰、誰邀請的。
-- 權限判斷仍然只看 email 是否在這張表裡（is_admin()），這兩個欄位只是顯示用。
-- 執行方式：Supabase Dashboard → SQL Editor → 貼上整份 → Run。可重複執行。

alter table public.admin_users add column if not exists name text;
alter table public.admin_users add column if not exists invited_by text;
