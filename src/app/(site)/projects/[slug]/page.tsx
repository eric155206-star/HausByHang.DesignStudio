import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCta } from "@/components/layout/ContactCta";
import { ParenLabel } from "@/components/ui/FrameCard";
import { categoryLabel } from "@/content/projects";
import { getPublishedProject, getPublishedProjects } from "@/lib/data/projects";

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  // Cache Components 規定至少要回傳一組參數；還沒有作品時給一個不存在的 slug，頁面會顯示 404
  return projects.length ? projects.map((p) => ({ slug: p.slug })) : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary || project.description,
    openGraph: { images: [{ url: (project.hero ?? project.cover).src }] },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) notFound();

  // 主圖：第一張橫式照片；其他照片進照片牆
  const main = project.gallery.find((g) => g.width > g.height) ?? project.gallery[0];
  const rest = project.gallery.filter((g) => g !== main);
  const meta = [
    { k: "地點", v: project.location },
    { k: "類型", v: [categoryLabel[project.category], ...project.tags].join(" · ") },
    { k: "坪數", v: project.area ? `${project.area} 坪` : "—" },
    { k: "完工", v: project.year ? String(project.year) : "—" },
  ];

  return (
    <div className="bg-surface">
      <section className="container-page flex flex-col gap-6 pb-[clamp(28px,4vw,48px)] pt-[clamp(8px,2vw,24px)]">
        <Link href="/projects" className="self-start text-sm font-medium text-link hover:underline">
          ← 作品集
        </Link>
        <div className="grid gap-x-[clamp(32px,6vw,96px)] gap-y-8 md:grid-cols-[1.9fr_1fr] md:items-end">
          <div className="flex flex-col gap-4">
            {project.eyebrow && <div className="eyebrow">{project.eyebrow}</div>}
            <h1 className="text-[clamp(40px,6.4vw,92px)] leading-[1.05] tracking-[-0.01em]">{project.title}</h1>
            {project.summary && (
              <p className="max-w-[24em] text-[clamp(18px,2.1vw,28px)] font-medium leading-[1.45] text-black text-pretty">{project.summary}</p>
            )}
          </div>
          <dl className="border-t border-black">
            {meta.map((m) => (
              <div key={m.k} className="flex items-center justify-between gap-6 border-b border-black py-3 text-[15px] font-medium last:border-b-0">
                <dt className="text-[13.5px] tracking-[0.03em] text-black">({m.k})</dt>
                <dd className="text-right text-black">{m.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {main && (
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-warm-gray md:aspect-[16/9]">
          <Image src={main.src} alt={main.alt} fill priority quality={90} sizes="100vw" className="object-cover" />
        </div>
      )}

      {project.description && (
        <section className="container-page grid gap-x-10 gap-y-6 py-[clamp(40px,6vw,80px)] md:grid-cols-[1fr_2.2fr]">
          <div className="flex items-start justify-between md:border-r md:border-black md:pr-6">
            <ParenLabel>Details</ParenLabel>
            <span aria-hidden className="hidden text-sm text-black md:inline">
              ↘
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <ParenLabel>About the project</ParenLabel>
            <p className="max-w-[40em] whitespace-pre-line text-[clamp(16px,1.6vw,19px)] leading-[1.95] text-ink text-pretty">{project.description}</p>
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="container-page pb-[clamp(56px,8vw,112px)]">
          <ParenLabel className="border-t border-black pb-5 pt-4">Project Gallery</ParenLabel>
          <div className="columns-1 gap-[clamp(16px,2vw,28px)] sm:columns-2">
            {rest.map((img) => (
              <Image
                key={img.src}
                src={img.src}
                alt={img.alt}
                width={img.width}
                height={img.height}
                quality={90}
                sizes="(min-width: 1280px) 576px, (min-width: 640px) 50vw, 100vw"
                className="mb-[clamp(16px,2vw,28px)] block h-auto w-full break-inside-avoid bg-warm-gray"
              />
            ))}
          </div>
        </section>
      )}

      <ContactCta />
    </div>
  );
}
