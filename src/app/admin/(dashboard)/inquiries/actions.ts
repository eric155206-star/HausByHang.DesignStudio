"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { inquiryStatuses } from "@/lib/inquiry-status";
import { INQUIRY_UPLOADS_BUCKET } from "@/lib/questionnaire";
import { adminKeyConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "../projects/actions";

/** 後台詢問單的寫入動作：改處理狀態與內部備註、刪除。都先 requireAdmin()，資料庫 RLS 也會再擋一次。 */

const updateSchema = z.object({
  status: z.enum(inquiryStatuses.map((s) => s.key) as [string, ...string[]]),
  note: z.string().trim().max(2000, "備註最多 2000 個字"),
});

export async function updateInquiry(id: string, input: z.input<typeof updateSchema>): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = updateSchema.safeParse(input);
  if (!z.uuid().safeParse(id).success || !parsed.success) {
    return { ok: false, error: parsed.success ? "找不到這筆詢問" : parsed.error.issues[0].message };
  }
  const { error } = await supabase
    .from("inquiries")
    .update({ status: parsed.data.status, admin_note: parsed.data.note || null })
    .eq("id", id);
  if (error) return { ok: false, error: `儲存失敗：${error.message}` };
  return { ok: true };
}

export async function deleteInquiry(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "找不到這筆詢問" };
  const { data: row } = await supabase.from("inquiries").select("reference_images").eq("id", id).maybeSingle();
  const { error } = await supabase.from("inquiries").delete().eq("id", id);
  if (error) return { ok: false, error: `刪除失敗：${error.message}` };
  // 客人上傳的參考圖跟著一起刪，不留個資在儲存空間
  const paths: string[] = row?.reference_images ?? [];
  if (paths.length && adminKeyConfigured) {
    const { error: removeError } = await createSupabaseAdminClient().storage.from(INQUIRY_UPLOADS_BUCKET).remove(paths);
    if (removeError) console.error("[inquiry] 參考圖刪除失敗", removeError.message);
  }
  redirect("/admin/inquiries");
}
