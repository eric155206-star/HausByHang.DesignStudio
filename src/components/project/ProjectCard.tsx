import Image from "next/image";
import Link from "next/link";
import { categoryLabel, type Project } from "@/content/projects";

/** 作品卡片：4:5 封面、名稱、地點 · 類型（· 坪數）、年份。 */
export function ProjectCard({ project, showArea = false }: { project: Project; showArea?: boolean }) {
  const meta = [project.location, categoryLabel[project.category], ...project.tags];
  if (showArea && project.area) meta.push(`${project.area} 坪`);

  return (
    <Link href={`/projects/${project.slug}`} className="group flex flex-col gap-4">
      <div className="relative aspect-[4/5] overflow-hidden bg-warm-gray">
        <Image
          src={project.cover.src}
          alt={project.cover.alt}
          fill
          sizes="(min-width: 1280px) 400px, (min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-[720ms] ease-brand group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="text-lg text-black">{project.title}</div>
          <div className="text-[13px] text-ink-3">{meta.join(" · ")}</div>
        </div>
        <div className="text-[13px] text-ink-4 tabular-nums">{project.year}</div>
      </div>
    </Link>
  );
}
