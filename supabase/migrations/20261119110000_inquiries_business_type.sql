-- 詢問單新增「營業類型」：商業空間才會填（餐廳、零售、百貨櫃位、辦公空間，或「其他：手動填寫的內容」）。
-- 只加一個可留空的欄位，不動既有資料。可重複執行。

alter table public.inquiries add column if not exists business_type text;

notify pgrst, 'reload schema';
