import { FrameCard } from "@/components/ui/FrameCard";
import { categoryLabel, type Project } from "@/content/projects";

/** 作品卡片：完工年份、分類標籤（有「老屋」時顯示老屋）、4:3 封面、名稱、簡述。 */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <FrameCard
      href={`/projects/${project.slug}`}
      meta={project.year ?? ""}
      tag={project.tags[0] ?? categoryLabel[project.category]}
      image={project.cover}
      title={project.title}
      text={project.summary || project.location}
    />
  );
}
