"use client";

import { useState } from "react";
import { Tag } from "@/components/ui/Tag";
import type { Project } from "@/content/projects";
import { FrameGrid } from "@/components/ui/FrameCard";
import { ProjectCard } from "./ProjectCard";

const filters = [
  { key: "all", label: "全部", match: () => true },
  { key: "residential", label: "住宅", match: (p: Project) => p.category === "residential" },
  { key: "commercial", label: "商業空間", match: (p: Project) => p.category === "commercial" },
  { key: "old-house", label: "老屋", match: (p: Project) => p.tags.includes("老屋") },
] as const;

type FilterKey = (typeof filters)[number]["key"];

/** 作品集：單選篩選 Tag ＋ 卡片 grid。 */
export function ProjectGrid({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<FilterKey>("all");
  const current = filters.find((f) => f.key === active) ?? filters[0];
  const list = projects.filter(current.match);

  return (
    <div className="flex flex-col gap-8">
      <div role="group" aria-label="篩選作品類型" className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Tag key={f.key} active={f.key === active} onClick={() => setActive(f.key)}>
            {f.label}
          </Tag>
        ))}
      </div>

      {list.length > 0 ? (
        <FrameGrid>
          {list.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </FrameGrid>
      ) : (
        <p className="border border-black px-6 py-16 text-center text-sm text-ink-3">這個分類的作品整理中，敬請期待。</p>
      )}
    </div>
  );
}
