"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { inquirySchema, type InquiryField, type InquiryState } from "@/lib/inquiry";
import { sendInquiryNotification, sendQuestionnaireNotification } from "@/lib/inquiry-notify";
import { inquiryToken, verifyInquiryToken } from "@/lib/inquiry-token";
import {
  INQUIRY_UPLOADS_BUCKET,
  MAX_REFERENCE_IMAGES,
  validateQuestionnaire,
  type QuestionnaireErrors,
  type QuestionnaireValues,
} from "@/lib/questionnaire";
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
  "businessType",
  "businessTypeOther",
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
      business_type: q.businessType,
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

  // 住宅接著顯示詳細問卷；題目都是居家生活，商業空間不適用
  return q.spaceType === "住宅"
    ? { status: "success", followUp: { id: data.id, token: inquiryToken(data.id) } }
    : { status: "success" };
}

/** 問卷與參考圖只在基本資料送出後的這段時間內可以補填 */
const FOLLOW_UP_HOURS = 24;

type FollowUpResult<T = object> = ({ ok: true } & T) | { ok: false; error: string; fieldErrors?: QuestionnaireErrors };

/** 確認通行碼沒錯、這筆詢問單還在補填期限內、而且問卷還沒填過。 */
async function loadFollowUp(id: string, token: string) {
  if (!adminKeyConfigured || !/^[0-9a-f-]{36}$/.test(id) || !verifyInquiryToken(id, token)) return null;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("inquiries")
    .select("id, name, email, created_at, questionnaire_at")
    .eq("id", id)
    .maybeSingle();
  if (!data || data.questionnaire_at) return null;
  if (Date.now() - new Date(data.created_at).getTime() > FOLLOW_UP_HOURS * 60 * 60 * 1000) return null;
  return { supabase, inquiry: data };
}

const EXPIRED = "這份問卷已經送出過或已逾時，如需補充請直接與我們聯繫。";
const refPath = (id: string, n: number) => `${id}/ref-${n}.jpg`;

/**
 * 發參考圖的上傳許可：每張圖一個只能用一次的上傳網址，瀏覽器拿著它直接傳到不公開的儲存空間。
 * 檔名固定是 ref-0 到 ref-4，所以一筆詢問單最多就是 5 張，重傳會蓋掉舊的。
 */
export async function createReferenceUploads(
  id: string,
  token: string,
  count: number,
): Promise<FollowUpResult<{ uploads: { path: string; token: string }[] }>> {
  const ctx = await loadFollowUp(id, token);
  if (!ctx) return { ok: false, error: EXPIRED };
  if (!Number.isInteger(count) || count < 1 || count > MAX_REFERENCE_IMAGES) {
    return { ok: false, error: `參考圖最多 ${MAX_REFERENCE_IMAGES} 張` };
  }
  const uploads: { path: string; token: string }[] = [];
  for (let n = 0; n < count; n++) {
    const { data, error } = await ctx.supabase.storage
      .from(INQUIRY_UPLOADS_BUCKET)
      .createSignedUploadUrl(refPath(id, n), { upsert: true });
    if (error || !data) {
      console.error("[inquiry] 參考圖上傳許可建立失敗", error?.message);
      return { ok: false, error: "參考圖暫時無法上傳，可以先略過，之後再用 LINE 或 Email 傳給我們。" };
    }
    uploads.push({ path: data.path, token: data.token });
  }
  return { ok: true, uploads };
}

/** 送出詳細問卷：驗證後寫進同一筆詢問單，再寄一封通知信。imageCount 是這次實際傳成功的參考圖張數。 */
export async function submitQuestionnaire(
  id: string,
  token: string,
  values: QuestionnaireValues,
  imageCount: number,
): Promise<FollowUpResult> {
  const ctx = await loadFollowUp(id, token);
  if (!ctx) return { ok: false, error: EXPIRED };

  const checked = validateQuestionnaire(values ?? {});
  if (!checked.ok) return { ok: false, error: "有幾題需要修正，請再確認一次。", fieldErrors: checked.errors };

  // 參考圖以儲存空間裡實際有的檔案為準，不直接相信瀏覽器報的數字
  const wanted = Math.max(0, Math.min(MAX_REFERENCE_IMAGES, Number.isInteger(imageCount) ? imageCount : 0));
  let images: string[] = [];
  if (wanted) {
    const { data: files } = await ctx.supabase.storage.from(INQUIRY_UPLOADS_BUCKET).list(id);
    const existing = new Set((files ?? []).map((f) => `${id}/${f.name}`));
    images = Array.from({ length: wanted }, (_, n) => refPath(id, n)).filter((p) => existing.has(p));
  }

  const { error } = await ctx.supabase
    .from("inquiries")
    .update({ questionnaire: checked.answers, reference_images: images, questionnaire_at: new Date().toISOString() })
    .eq("id", id)
    .is("questionnaire_at", null);
  if (error) {
    console.error("[inquiry] 問卷儲存失敗", error.message);
    return { ok: false, error: `系統暫時無法送出，請直接來信 ${site.email}，我們會盡快與您聯繫。` };
  }

  after(() => sendQuestionnaireNotification(id, ctx.inquiry, checked.answers, images.length));
  return { ok: true };
}
