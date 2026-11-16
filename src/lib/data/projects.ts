import { cacheLife, cacheTag } from "next/cache";
import { projects as staticProjects, type Project, type ProjectImage } from "@/content/projects";
import { publicImageUrl, supabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * 前台讀作品的唯一入口。
 * - 已設定 Supabase：讀資料庫裡「已發佈」的作品，結果快取起來，後台存檔時用 updateTag("projects") 讓快取失效。
 * - 尚未設定：回傳 src/content/projects.ts 的暫存資料。
 */
export const PROJECTS_TAG = "projects";

type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  subtitle_en: string | null;
  category: Project["category"];
  is_old_house: boolean;
  area_ping: number | null;
  location: string | null;
  completed_year: number | null;
  summary: string | null;
  description: string | null;
  cover_image_path: string | null;
  cover_alt: string | null;
  is_featured: boolean;
  project_images: {
    image_path: string;
    alt_text: string;
    width: number;
    height: number;
    sort_order: number;
  }[];
};

const SELECT = `id, title, slug, subtitle_en, category, is_old_house, area_ping, location, completed_year,
  summary, description, cover_image_path, cover_alt, is_featured,
  project_images (image_path, alt_text, width, height, sort_order)`;

function toProject(row: ProjectRow): Project {
  const gallery: ProjectImage[] = [...row.project_images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => ({
      src: publicImageUrl(img.image_path),
      width: img.width,
      height: img.height,
      alt: img.alt_text || row.title,
    }));
  const hero = gallery.find((g) => g.width > g.height) ?? gallery[0];

  return {
    slug: row.slug,
    title: row.title,
    eyebrow: row.subtitle_en ?? "",
    location: row.location ?? "",
    category: row.category,
    tags: row.is_old_house ? ["老屋"] : [],
    area: row.area_ping,
    year: row.completed_year,
    summary: row.summary ?? "",
    description: row.description ?? row.summary ?? "",
    cover: row.cover_image_path
      ? { src: publicImageUrl(row.cover_image_path), width: 0, height: 0, alt: row.cover_alt ?? row.title }
      : (gallery[0] ?? { src: "/brand/mark.png", width: 0, height: 0, alt: row.title }),
    hero,
    gallery,
    featured: row.is_featured,
  };
}

/** 所有已發佈作品，依後台排序、再依完工年份新到舊。 */
export async function getPublishedProjects(): Promise<Project[]> {
  "use cache";
  cacheTag(PROJECTS_TAG);
  cacheLife("days");

  if (!supabaseConfigured) {
    return [...staticProjects].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  }

  const { data, error } = await createPublicClient()
    .from("projects")
    .select(SELECT)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("completed_year", { ascending: false, nullsFirst: false });

  if (error) throw new Error(`讀取作品失敗：${error.message}`);
  return (data as ProjectRow[]).map(toProject);
}

export async function getPublishedProject(slug: string): Promise<Project | undefined> {
  const all = await getPublishedProjects();
  return all.find((p) => p.slug === slug);
}
