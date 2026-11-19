"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { inquirySchema, type InquiryField, type InquiryState } from "@/lib/inquiry";
import { sendInquiryNotification } from "@/lib/inquiry-notify";
import { site } from "@/lib/site";
import { adminKeyConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin";

/** 同一個來源一小時內最多送幾筆 */
const HOURLY_LIMIT = 5;

/** 來源 IP 加鹽雜湊成指紋，只用來做頻率限制，資料庫裡不存原始 IP。 */
async function ipFingerprint() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const salt = process.env.IP_HASH_SALT || process.env.SUPABASE_SECRET_KEY || "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

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
 * 預約諮詢表單的 Server Action：在伺服器端驗證後寫入資料庫，再寄通知信到公司信箱。
 * 瀏覽器不直接碰資料庫；inquiries 表沒有對外的新增權限，只有這裡（secret key）能寫入。
 * 順序是「先存、後寄信」：就算通知信沒寄成功，後台還是看得到這筆詢問。
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

  const failed = (message: string): InquiryState => ({ status: "error", message, values: raw });
  const fallback = `系統暫時無法送出，請直接來信 ${site.email}，我們會盡快與您聯繫。`;

  if (!adminKeyConfigured) {
    console.error("[inquiry] SUPABASE_SECRET_KEY 尚未設定，無法儲存詢問單");
    return failed(fallback);
  }

  const supabase = createSupabaseAdminClient();
  const ipHash = await ipFingerprint();

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  if (countError) {
    console.error("[inquiry] 頻率檢查失敗", countError.message);
    return failed(fallback);
  }
  if ((count ?? 0) >= HOURLY_LIMIT) {
    return failed(`短時間內送出太多次了，請稍後再試，或直接來信 ${site.email}。`);
  }

  const q = parsed.data;
  const { data, error } = await supabase
    .from("inquiries")
    .insert({
      name: q.name,
      phone: q.phone,
      line_id: q.lineId,
      email: q.email,
      space_type: q.spaceType,
      house_condition: q.houseCondition,
      house_type: q.houseType,
      house_age: q.houseAge,
      region: q.region,
      area_ping: q.area,
      budget: q.budget,
      message: q.message,
      ip_hash: ipHash,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[inquiry] 儲存失敗", error.message);
    return failed(fallback);
  }

  // 通知信在回應送出之後才寄，訪客不用等；寄成功就記下時間，後台可以看到哪幾筆沒通知到
  after(async () => {
    if (await sendInquiryNotification(data.id, q)) {
      await supabase.from("inquiries").update({ notified_at: new Date().toISOString() }).eq("id", data.id);
    }
  });

  return { status: "success" };
}
