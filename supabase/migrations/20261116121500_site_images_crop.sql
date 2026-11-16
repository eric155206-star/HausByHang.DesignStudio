-- 網站圖片線上裁切：保留原圖以便之後重新裁切，並讓同一個位置可以有手機版的裁切。
-- original_path：上傳時的原圖（縮到長邊 2400px 後），重新裁切時拿它當來源。
-- mobile_*：手機版裁切後的圖（目前只有首頁主視覺用到），沒有就沿用 image_path。
-- 只新增欄位，不動現有資料。可重複執行。

alter table public.site_images add column if not exists original_path text;
alter table public.site_images add column if not exists mobile_image_path text;
alter table public.site_images add column if not exists mobile_width integer check (mobile_width > 0);
alter table public.site_images add column if not exists mobile_height integer check (mobile_height > 0);
