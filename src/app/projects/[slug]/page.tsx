import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCta } from "@/components/layout/ContactCta";
import { PageHeader, Placeholder } from "@/components/layout/PageHeader";

// 骨架階段先放一個示範作品，第 4 步改成從 Supabase 讀取已發佈的作品
const projects: Record<string, { title: string; eyebrow: string }> = {
  "banqiao-sanmin": { title: "板橋三民路", eyebrow: "Banqiao · Residence" },
};

export function generateStaticParams() {
  return Object.keys(projects).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = projects[slug];
  return project ? { title: project.title } : {};
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = projects[slug];
  if (!project) notFound();

  return (
    <>
      <div className="container-page pt-[clamp(24px,3vw,40px)]">
        <Link href="/projects" className="text-sm font-medium text-link hover:underline">
          ← 作品集
        </Link>
      </div>
      <PageHeader eyebrow={project.eyebrow} title={project.title} />
      <Placeholder>主圖、案例描述、資料表與照片牆將在下一步加入</Placeholder>
      <ContactCta />
    </>
  );
}
