/** 詢問單的處理狀態。資料庫存英文代碼，畫面顯示中文。 */
export const inquiryStatuses = [
  { key: "new", label: "未處理" },
  { key: "contacted", label: "已聯絡" },
  { key: "closed", label: "已結案" },
] as const;

export type InquiryStatus = (typeof inquiryStatuses)[number]["key"];

export const inquiryStatusLabel = Object.fromEntries(inquiryStatuses.map((s) => [s.key, s.label])) as Record<
  InquiryStatus,
  string
>;

export function isInquiryStatus(v: unknown): v is InquiryStatus {
  return inquiryStatuses.some((s) => s.key === v);
}

/** 後台顯示時間一律用台北時間，例如 2026/11/19 10:25 */
export function formatTaipei(iso: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}
