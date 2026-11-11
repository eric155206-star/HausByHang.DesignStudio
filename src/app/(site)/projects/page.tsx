import type { Metadata } from "next";
import { ContactCta } from "@/components/layout/ContactCta";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectGrid } from "@/components/project/ProjectGrid";
import { getPublishedProjects } from "@/lib/data/projects";

export const metadata: Metadata = {
  title: "作品集",
  description: "沆設計的住宅、商業空間與老屋翻新作品。",
};

export default async function Page() {
  const projects = await getPublishedProjects();
  return (
    <>
      <PageHeader eyebrow="Works" title="作品集" />
      <section className="container-page pb-[clamp(56px,8vw,112px)]">
        <ProjectGrid projects={projects} />
      </section>
      <ContactCta />
    </>
  );
}
