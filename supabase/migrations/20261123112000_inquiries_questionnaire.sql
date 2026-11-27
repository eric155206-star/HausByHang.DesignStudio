-- 詳細問卷：住宅客人送出基本資料後接著填的題目，答案存在同一筆詢問單。
-- questionnaire      題目 id → 答案（題目清單在程式的 src/lib/questionnaire.ts）
-- reference_images   參考圖在 Storage 裡的路徑
-- questionnaire_at   問卷送出時間；有值就不能再填第二次
-- 參考圖放在不公開的 inquiry-uploads bucket：故意不建立任何 Storage policy，
-- 訪客只能用伺服器發的一次性上傳網址傳檔，讀取只有後台（伺服器用 secret key 產生限時連結）。
-- 執行方式：Supabase Dashboard → SQL Editor → 貼上整份 → Run。可重複執行，不動既有資料。

alter table public.inquiries add column if not exists questionnaire jsonb;
alter table public.inquiries add column if not exists reference_images text[] not null default '{}';
alter table public.inquiries add column if not exists questionnaire_at timestamptz;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inquiry-uploads', 'inquiry-uploads', false, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

notify pgrst, 'reload schema';
