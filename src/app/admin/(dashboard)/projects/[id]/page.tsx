import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteProjectButton } from "@/components/admin/DeleteProjectButton";
import { ImageManager } from "@/components/admin/ImageManager";
import { ProjectForm, type ProjectFormValues } from "@/components/admin/ProjectForm";
import { requireAdmin } from "@/lib/admin/auth";
import { publicImageUrl } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "編輯作品" };

export default async function EditProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const { supabase } = await requireAdmin();
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, title, slug, subtitle_en, category, is_old_house, location, area_ping, completed_year, summary, description, is_featured, is_published, sort_order, cover_image_path",
    )
    .eq("id", id)
    .maybeSingle<ProjectFormValues>();
  if (!project) notFound();

  const { data: images } = await supabase
    .from("project_images")
    .select("id, image_path, width, height, alt_text")
    .eq("project_id", id)
    .order("sort_order");

  const adminImages = (images ?? []).map((img) => ({
    id: img.id,
    path: img.image_path,
    url: publicImageUrl(img.image_path),
    width: img.width,
    height: img.height,
    alt: img.alt_text,
  }));

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/projects" className="text-sm text-link hover:underline">
        ← 作品列表
      </Link>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-2xl">{project.title}</h1>
        {project.is_published && (
          <Link href={`/projects/${project.slug}`} target="_blank" className="text-sm text-link hover:underline">
            在網站上查看 ↗
          </Link>
        )}
      </div>
      <ProjectForm project={project} />
      <ImageManager
        key={adminImages.map((i) => i.id + i.alt).join() + project.cover_image_path}
        projectId={project.id}
        projectTitle={project.title}
        images={adminImages}
        coverPath={project.cover_image_path}
      />
      <DeleteProjectButton id={project.id} title={project.title} />
    </div>
  );
}
