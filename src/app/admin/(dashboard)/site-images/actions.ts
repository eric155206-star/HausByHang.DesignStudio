"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { SITE_IMAGES_TAG } from "@/lib/data/site-images";
import { siteImageSlotKeys } from "@/lib/site-images";
import { PROJECT_IMAGES_BUCKET } from "@/lib/supabase/config";
import type { ActionResult } from "../projects/actions";

/** 後台「網站圖片」的寫入動作。照片已由瀏覽器直接傳到 Storage 的 site/<slot>/ 底下。 */

const slotSchema = z.enum(siteImageSlotKeys as [string, ...string[]]);

const uploadedSchema = z.object({
  path: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().trim().max(200),
});

async function currentPath(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], slot: string) {
  const { data } = await supabase.from("site_images").select("image_path").eq("slot", slot).maybeSingle();
  return data?.image_path ?? null;
}

/** 設定或更換某個位置的照片；舊檔案一併從 Storage 刪除。 */
export async function setSiteImage(slot: string, uploaded: z.input<typeof uploadedSchema>): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const s = slotSchema.safeParse(slot);
  const u = uploadedSchema.safeParse(uploaded);
  if (!s.success || !u.success) return { ok: false, error: "照片資料格式不正確" };
  if (!u.data.path.startsWith(`site/${s.data}/`)) return { ok: false, error: "照片路徑不正確" };

  const old = await currentPath(supabase, s.data);
  const { error } = await supabase.from("site_images").upsert({
    slot: s.data,
    image_path: u.data.path,
    alt_text: u.data.alt,
    width: u.data.width,
    height: u.data.height,
  });
  if (error) {
    await supabase.storage.from(PROJECT_IMAGES_BUCKET).remove([u.data.path]);
    return { ok: false, error: `照片存檔失敗：${error.message}` };
  }
  if (old && old !== u.data.path) await supabase.storage.from(PROJECT_IMAGES_BUCKET).remove([old]);
  updateTag(SITE_IMAGES_TAG);
  return { ok: true };
}

export async function saveSiteImageAlt(slot: string, alt: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const s = slotSchema.safeParse(slot);
  const a = z.string().trim().max(200).safeParse(alt);
  if (!s.success || !a.success) return { ok: false, error: "資料格式不正確" };
  const { error } = await supabase.from("site_images").update({ alt_text: a.data }).eq("slot", s.data);
  if (error) return { ok: false, error: `儲存失敗：${error.message}` };
  updateTag(SITE_IMAGES_TAG);
  return { ok: true };
}

/** 移除某個位置的照片，前台回到預設圖或佔位。 */
export async function removeSiteImage(slot: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const s = slotSchema.safeParse(slot);
  if (!s.success) return { ok: false, error: "資料格式不正確" };
  const old = await currentPath(supabase, s.data);
  const { error } = await supabase.from("site_images").delete().eq("slot", s.data);
  if (error) return { ok: false, error: `移除失敗：${error.message}` };
  if (old) await supabase.storage.from(PROJECT_IMAGES_BUCKET).remove([old]);
  updateTag(SITE_IMAGES_TAG);
  return { ok: true };
}
