"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { SITE_IMAGES_TAG } from "@/lib/data/site-images";
import { siteImageSlotKeys, siteImageSlots } from "@/lib/site-images";
import { PROJECT_IMAGES_BUCKET } from "@/lib/supabase/config";
import type { ActionResult } from "../projects/actions";

/** 後台「網站圖片」的寫入動作。照片已由瀏覽器直接傳到 Storage 的 site/<slot>/ 底下。 */

const slotSchema = z.enum(siteImageSlotKeys as [string, ...string[]]);

const fileSchema = z.object({
  path: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const uploadedSchema = z.object({
  /** 原圖，之後重新裁切用 */
  original: z.string().min(1),
  /** 主要版本（電腦版） */
  desktop: fileSchema,
  /** 手機版，只有需要分開裁的位置才有 */
  mobile: fileSchema.optional(),
  alt: z.string().trim().max(200),
});

type Supabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

async function currentPaths(supabase: Supabase, slot: string): Promise<string[]> {
  const { data } = await supabase
    .from("site_images")
    .select("image_path, mobile_image_path, original_path")
    .eq("slot", slot)
    .maybeSingle();
  if (!data) return [];
  return [data.image_path, data.mobile_image_path, data.original_path].filter((p): p is string => !!p);
}

/** 設定、更換或重新裁切某個位置的照片；不再使用的舊檔案一併從 Storage 刪除。 */
export async function setSiteImage(slot: string, uploaded: z.input<typeof uploadedSchema>): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const s = slotSchema.safeParse(slot);
  const u = uploadedSchema.safeParse(uploaded);
  if (!s.success || !u.success) return { ok: false, error: "照片資料格式不正確" };

  const config = siteImageSlots.find((c) => c.slot === s.data)!;
  const needsMobile = config.crops.some((c) => c.key === "mobile");
  if (needsMobile !== !!u.data.mobile) return { ok: false, error: "照片資料格式不正確" };

  const next = [u.data.original, u.data.desktop.path, u.data.mobile?.path].filter((p): p is string => !!p);
  if (next.some((p) => !p.startsWith(`site/${s.data}/`))) return { ok: false, error: "照片路徑不正確" };

  const old = await currentPaths(supabase, s.data);
  const { error } = await supabase.from("site_images").upsert({
    slot: s.data,
    image_path: u.data.desktop.path,
    width: u.data.desktop.width,
    height: u.data.desktop.height,
    mobile_image_path: u.data.mobile?.path ?? null,
    mobile_width: u.data.mobile?.width ?? null,
    mobile_height: u.data.mobile?.height ?? null,
    original_path: u.data.original,
    alt_text: u.data.alt,
  });
  if (error) {
    // 存檔失敗：把這次新傳的檔案清掉，原本在用的不動
    const fresh = next.filter((p) => !old.includes(p));
    if (fresh.length) await supabase.storage.from(PROJECT_IMAGES_BUCKET).remove(fresh);
    return { ok: false, error: `照片存檔失敗：${error.message}` };
  }
  const unused = old.filter((p) => !next.includes(p));
  if (unused.length) await supabase.storage.from(PROJECT_IMAGES_BUCKET).remove(unused);
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
  const old = await currentPaths(supabase, s.data);
  const { error } = await supabase.from("site_images").delete().eq("slot", s.data);
  if (error) return { ok: false, error: `移除失敗：${error.message}` };
  if (old.length) await supabase.storage.from(PROJECT_IMAGES_BUCKET).remove(old);
  updateTag(SITE_IMAGES_TAG);
  return { ok: true };
}
