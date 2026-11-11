"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { PROJECTS_TAG } from "@/lib/data/projects";
import { PROJECT_IMAGES_BUCKET } from "@/lib/supabase/config";

/**
 * 後台作品的所有寫入動作。每個動作都先 requireAdmin()，資料庫的 RLS 也會再檢查一次。
 * 寫入後呼叫 updateTag("projects")，前台下一次讀取就會拿到新資料。
 */

const slugRule = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "請填寫網址代碼")
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "只能用小寫英文、數字和連字號，例如 banqiao-sanmin");

const optionalText = z
  .string()
  .trim()
  .transform((v) => v || null);

const optionalNumber = (label: string, min: number, max: number, int = false) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (!v) return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n < min || n > max || (int && !Number.isInteger(n))) {
        ctx.addIssue({ code: "custom", message: `${label}請填 ${min}–${max} 的${int ? "整數" : "數字"}` });
        return z.NEVER;
      }
      return n;
    });

const projectSchema = z.object({
  title: z.string().trim().min(1, "請填寫作品名稱").max(60),
  slug: slugRule,
  subtitle_en: optionalText,
  category: z.enum(["residential", "commercial"]),
  is_old_house: z.boolean(),
  location: optionalText,
  area_ping: optionalNumber("坪數", 0.1, 99999),
  completed_year: optionalNumber("完工年份", 1990, 2100, true),
  summary: optionalText,
  description: optionalText,
  is_featured: z.boolean(),
  is_published: z.boolean(),
  sort_order: optionalNumber("排序", -9999, 9999, true).transform((v) => v ?? 0),
});

export type ProjectFormState = {
  status: "idle" | "saved" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

function readForm(formData: FormData) {
  const text = (k: string) => String(formData.get(k) ?? "");
  return {
    title: text("title"),
    slug: text("slug"),
    subtitle_en: text("subtitle_en"),
    category: text("category"),
    is_old_house: formData.get("is_old_house") === "on",
    location: text("location"),
    area_ping: text("area_ping"),
    completed_year: text("completed_year"),
    summary: text("summary"),
    description: text("description"),
    is_featured: formData.get("is_featured") === "on",
    is_published: formData.get("is_published") === "on",
    sort_order: text("sort_order"),
  };
}

function dbError(message: string, code?: string): ProjectFormState {
  if (code === "23505") return { status: "error", message: "這個網址代碼已經被其他作品使用", fieldErrors: { slug: "已被使用" } };
  if (message.includes("projects_published_needs_cover"))
    return { status: "error", message: "發佈前請先在下方照片區選一張「設為封面」，並填好替代文字。" };
  return { status: "error", message: `儲存失敗：${message}` };
}

/** 新增作品：只需要名稱和網址代碼，建立後進入編輯頁上傳照片。 */
export async function createProject(_prev: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { supabase } = await requireAdmin();
  const parsed = z
    .object({ title: projectSchema.shape.title, slug: slugRule })
    .safeParse({ title: formData.get("title") ?? "", slug: formData.get("slug") ?? "" });
  if (!parsed.success) {
    return {
      status: "error",
      message: "有欄位需要修正",
      fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])),
    };
  }

  const { data, error } = await supabase.from("projects").insert(parsed.data).select("id").single();
  if (error) return dbError(error.message, error.code);
  redirect(`/admin/projects/${data.id}`);
}

export async function saveProject(id: string, _prev: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { supabase } = await requireAdmin();
  const parsed = projectSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "有欄位需要修正",
      fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])),
    };
  }

  const { error } = await supabase.from("projects").update(parsed.data).eq("id", id);
  if (error) return dbError(error.message, error.code);

  updateTag(PROJECTS_TAG);
  return { status: "saved", message: parsed.data.is_published ? "已儲存，網站已更新。" : "已儲存（尚未發佈，網站上看不到）。" };
}

/** 刪除作品：連同 Storage 裡的照片檔一起刪。 */
export async function deleteProject(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { data: images } = await supabase.from("project_images").select("image_path").eq("project_id", id);
  const paths = (images ?? []).map((i) => i.image_path);
  if (paths.length) await supabase.storage.from(PROJECT_IMAGES_BUCKET).remove(paths);

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { ok: false, error: `刪除失敗：${error.message}` } as const;
  updateTag(PROJECTS_TAG);
  redirect("/admin/projects");
}

// ─────────────── 照片 ───────────────

/** 照片動作的結果。用回傳值而不是丟錯誤，因為正式環境會把錯誤訊息遮掉，使用者看不到原因。 */
export type ActionResult = { ok: true } | { ok: false; error: string };

const uploadedSchema = z.array(
  z.object({
    path: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    alt: z.string().trim().max(200),
  }),
);

/** 照片已從瀏覽器直接上傳到 Storage，這裡把檔案資訊寫進資料表。 */
export async function addImages(projectId: string, uploaded: z.input<typeof uploadedSchema>): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = uploadedSchema.safeParse(uploaded);
  if (!parsed.success) return { ok: false, error: "照片資料格式不正確" };
  const items = parsed.data;
  // 只接受放在這個作品資料夾底下的檔案，避免被塞入別的路徑
  if (items.some((i) => !i.path.startsWith(`${projectId}/`))) return { ok: false, error: "照片路徑不正確" } as const;

  const { data: last } = await supabase
    .from("project_images")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const start = (last?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("project_images").insert(
    items.map((i, n) => ({
      project_id: projectId,
      image_path: i.path,
      width: i.width,
      height: i.height,
      alt_text: i.alt,
      sort_order: start + n,
    })),
  );
  if (error) {
    await supabase.storage.from(PROJECT_IMAGES_BUCKET).remove(items.map((i) => i.path));
    return { ok: false, error: `照片存檔失敗：${error.message}` } as const;
  }
  updateTag(PROJECTS_TAG);
  return { ok: true };
}

const imageEditsSchema = z.array(
  z.object({ id: z.uuid(), alt_text: z.string().trim().max(200), sort_order: z.number().int() }),
);

/** 儲存照片的排序與替代文字。 */
export async function saveImages(projectId: string, edits: z.input<typeof imageEditsSchema>): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = imageEditsSchema.safeParse(edits);
  if (!parsed.success) return { ok: false, error: "照片資料格式不正確" };
  const items = parsed.data;
  for (const item of items) {
    const { error } = await supabase
      .from("project_images")
      .update({ alt_text: item.alt_text, sort_order: item.sort_order })
      .eq("id", item.id)
      .eq("project_id", projectId);
    if (error) return { ok: false, error: `照片更新失敗：${error.message}` } as const;
  }

  // 封面的替代文字跟著照片同步
  const { data: project } = await supabase.from("projects").select("cover_image_path").eq("id", projectId).single();
  if (project?.cover_image_path) {
    const { data: cover } = await supabase
      .from("project_images")
      .select("alt_text")
      .eq("project_id", projectId)
      .eq("image_path", project.cover_image_path)
      .maybeSingle();
    if (cover) await supabase.from("projects").update({ cover_alt: cover.alt_text }).eq("id", projectId);
  }
  updateTag(PROJECTS_TAG);
  return { ok: true };
}

export async function setCover(projectId: string, imageId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { data: img, error } = await supabase
    .from("project_images")
    .select("image_path, alt_text")
    .eq("id", imageId)
    .eq("project_id", projectId)
    .single();
  if (error || !img) return { ok: false, error: "找不到這張照片" } as const;

  const { data: project } = await supabase.from("projects").select("title").eq("id", projectId).single();
  const { error: updateError } = await supabase
    .from("projects")
    .update({ cover_image_path: img.image_path, cover_alt: img.alt_text || project?.title || "" })
    .eq("id", projectId);
  if (updateError) return { ok: false, error: `設定封面失敗：${updateError.message}` } as const;
  updateTag(PROJECTS_TAG);
  return { ok: true };
}

export async function deleteImage(projectId: string, imageId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { data: img } = await supabase
    .from("project_images")
    .select("image_path")
    .eq("id", imageId)
    .eq("project_id", projectId)
    .single();
  if (!img) return { ok: false, error: "找不到這張照片" } as const;

  const { data: project } = await supabase
    .from("projects")
    .select("cover_image_path, is_published")
    .eq("id", projectId)
    .single();
  const isCover = project?.cover_image_path === img.image_path;
  if (isCover && project?.is_published) {
    return { ok: false, error: "這張是已發佈作品的封面，請先把其他照片設為封面再刪除。" } as const;
  }
  if (isCover) {
    await supabase.from("projects").update({ cover_image_path: null, cover_alt: null }).eq("id", projectId);
  }

  const { error } = await supabase.from("project_images").delete().eq("id", imageId);
  if (error) return { ok: false, error: `刪除失敗：${error.message}` } as const;
  await supabase.storage.from(PROJECT_IMAGES_BUCKET).remove([img.image_path]);
  updateTag(PROJECTS_TAG);
  return { ok: true };
}
