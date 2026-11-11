import type { Metadata } from "next";
import { ContactCta } from "@/components/layout/ContactCta";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectGrid } from "@/components/project/ProjectGrid";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "作品集",
  description: "沆設計的住宅、商業空間與老屋翻新作品。",
};

export default function Page() {
  const sorted = [...projects].sort((a, b) => b.year - a.year);
  return (
    <>
      <PageHeader eyebrow="Works" title="作品集" />
      <section className="container-page pb-[clamp(56px,8vw,112px)]">
        <ProjectGrid projects={sorted} />
      </section>
      <ContactCta />
    </>
  );
}
