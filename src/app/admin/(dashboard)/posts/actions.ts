"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { POSTS_TAG } from "@/lib/data/posts";
import { imageSrcs, sanitizeDoc } from "@/lib/posts/content";
import { PROJECT_IMAGES_BUCKET, publicImageUrl } from "@/lib/supabase/config";
import type { ActionResult } from "../projects/actions";

/**
 * 後台文章的所有寫入動作。每個動作都先 requireAdmin()，資料庫的 RLS 也會再檢查一次。
 * 寫入後呼叫 updateTag("posts")，前台下一次讀取就會拿到新資料。
 * 文章的圖片（封面與內文）都放在 Storage 的 posts/<文章 id>/ 底下。
 */

const slugRule = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "請填寫網址代碼")
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "只能用小寫英文、數字和連字號，例如 old-house-budget");

const titleRule = z.string().trim().min(1, "請填寫標題").max(80, "標題最多 80 個字");

export type PostFormState = {
  status: "idle" | "saved" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

function fieldErrors(error: z.ZodError) {
  return Object.fromEntries(error.issues.map((i) => [String(i.path[0]), i.message]));
}

function dbError(message: string, code?: string): PostFormState {
  if (code === "23505") return { status: "error", message: "這個網址代碼已經被其他文章使用", fieldErrors: { slug: "已被使用" } };
  return { status: "error", message: `儲存失敗：${message}` };
}

/** 台北時間的今天，YYYY-MM-DD */
function todayInTaipei() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(new Date());
}

/** 新增文章：只需要標題和網址代碼，建立後進入編輯頁寫內文。 */
export async function createPost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const { supabase } = await requireAdmin();
  const parsed = z
    .object({ title: titleRule, slug: slugRule })
    .safeParse({ title: formData.get("title") ?? "", slug: formData.get("slug") ?? "" });
  if (!parsed.success) return { status: "error", message: "有欄位需要修正", fieldErrors: fieldErrors(parsed.error) };

  const { data, error } = await supabase.from("posts").insert(parsed.data).select("id").single();
  if (error) return dbError(error.message, error.code);
  redirect(`/admin/posts/${data.id}`);
}

const postSchema = z.object({
  title: titleRule,
  slug: slugRule,
  excerpt: z.string().trim().max(200, "摘要最多 200 個字"),
  published_on: z.union([z.literal(""), z.iso.date("日期格式不正確")]),
  is_published: z.boolean(),
});

export type PostInput = z.input<typeof postSchema> & { content: unknown };

/** 儲存文章。內文先清理成只剩認得的結構再存。 */
export async function savePost(id: string, input: PostInput): Promise<PostFormState> {
  const { supabase } = await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { status: "error", message: "找不到這篇文章" };
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "有欄位需要修正", fieldErrors: fieldErrors(parsed.error) };

  const content = sanitizeDoc(input.content);
  if (JSON.stringify(content).length > 400_000) return { status: "error", message: "內文太長了，請分成幾篇文章。" };

  // 內文裡的圖片必須是這篇文章資料夾裡的檔案
  const prefix = publicImageUrl(`posts/${id}/`);
  if (imageSrcs(content).some((src) => !src.startsWith(prefix))) {
    return { status: "error", message: "內文裡有不是從這裡上傳的圖片，請刪掉後用「圖片」按鈕重新上傳。" };
  }

  // 發佈時沒填日期就用今天
  const published_on = parsed.data.published_on || (parsed.data.is_published ? todayInTaipei() : null);

  const { error } = await supabase
    .from("posts")
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt || null,
      is_published: parsed.data.is_published,
      published_on,
      content,
    })
    .eq("id", id);
  if (error) return dbError(error.message, error.code);

  updateTag(POSTS_TAG);
  return { status: "saved", message: parsed.data.is_published ? "已儲存，網站已更新。" : "已儲存（尚未發佈，網站上看不到）。" };
}

const coverSchema = z.object({
  path: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

/** 設定或更換封面；舊封面檔一併刪除。 */
export async function setPostCover(id: string, cover: z.input<typeof coverSchema>): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = coverSchema.safeParse(cover);
  if (!z.uuid().safeParse(id).success || !parsed.success) return { ok: false, error: "封面資料格式不正確" };
  if (!parsed.data.path.startsWith(`posts/${id}/`)) return { ok: false, error: "封面路徑不正確" };

  const { data: old } = await supabase.from("posts").select("cover_image_path").eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("posts")
    .update({ cover_image_path: parsed.data.path, cover_width: parsed.data.width, cover_height: parsed.data.height })
    .eq("id", id);
  if (error) {
    await supabase.storage.from(PROJECT_IMAGES_BUCKET).remove([parsed.data.path]);
    return { ok: false, error: `封面存檔失敗：${error.message}` };
  }
  if (old?.cover_image_path && old.cover_image_path !== parsed.data.path) {
    await supabase.storage.from(PROJECT_IMAGES_BUCKET).remove([old.cover_image_path]);
  }
  updateTag(POSTS_TAG);
  return { ok: true };
}

export async function removePostCover(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "找不到這篇文章" };
  const { data: old } = await supabase.from("posts").select("cover_image_path").eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("posts")
    .update({ cover_image_path: null, cover_width: null, cover_height: null })
    .eq("id", id);
  if (error) return { ok: false, error: `移除失敗：${error.message}` };
  if (old?.cover_image_path) await supabase.storage.from(PROJECT_IMAGES_BUCKET).remove([old.cover_image_path]);
  updateTag(POSTS_TAG);
  return { ok: true };
}

/** 刪除文章：連同 Storage 裡這篇文章資料夾的所有圖片一起刪。 */
export async function deletePost(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "找不到這篇文章" };

  const storage = supabase.storage.from(PROJECT_IMAGES_BUCKET);
  const { data: files } = await storage.list(`posts/${id}`, { limit: 1000 });
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return { ok: false, error: `刪除失敗：${error.message}` };
  if (files?.length) await storage.remove(files.map((f) => `posts/${id}/${f.name}`));

  updateTag(POSTS_TAG);
  redirect("/admin/posts");
}
