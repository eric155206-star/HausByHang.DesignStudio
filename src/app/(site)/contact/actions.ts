"use server";

import { site } from "@/lib/site";
import { inquirySchema, type InquiryField, type InquiryState } from "@/lib/inquiry";

const FIELDS: InquiryField[] = [
  "name",
  "phone",
  "lineId",
  "email",
  "spaceType",
  "houseCondition",
  "houseType",
  "houseAge",
  "region",
  "area",
  "budget",
  "message",
  "consent",
];

/**
 * 預約諮詢表單的 Server Action：在伺服器端驗證，瀏覽器不直接碰資料庫。
 *
 * 第 3 步只做驗證。第 4 步接上：寫入 Supabase inquiries、Resend 通知信、IP 頻率限制。
 * 在那之前，正式環境（VERCEL_ENV=production）會請訪客改用 Email 聯絡，避免詢問單送出後遺失；
 * Preview 與本機則模擬送出成功，方便測試畫面。
 */
export async function submitInquiry(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  // Honeypot：人看不到這個欄位，機器人會填。填了就假裝成功，直接丟掉。
  if (String(formData.get("company") ?? "").trim()) {
    return { status: "success" };
  }

  const raw = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")])) as Record<
    InquiryField,
    string
  >;

  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<InquiryField, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as InquiryField;
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "有幾個欄位需要修正，請再確認一次。", fieldErrors, values: raw };
  }

  if (process.env.VERCEL_ENV === "production") {
    return {
      status: "error",
      message: `線上表單即將開放，目前請先來信 ${site.email}，我們會盡快與您聯繫。`,
      values: raw,
    };
  }

  return { status: "success" };
}
