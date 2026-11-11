import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCta } from "@/components/layout/ContactCta";
import { Badge } from "@/components/ui/Badge";
import { categoryLabel, getProject, projects } from "@/content/projects";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
    openGraph: { images: [{ url: (project.hero ?? project.cover).src }] },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const [main, ...rest] = project.gallery;
  const meta = [
    { k: "地點", v: project.location },
    { k: "類型", v: [categoryLabel[project.category], ...project.tags].join(" · ") },
    { k: "坪數", v: project.area ? `${project.area} 坪` : "—" },
    { k: "完工", v: String(project.year) },
  ];

  return (
    <>
      <section className="container-page flex flex-col gap-6 pt-[clamp(28px,4vw,48px)]">
        <Link href="/projects" className="self-start text-sm font-medium text-link hover:underline">
          ← 作品集
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="eyebrow">{project.eyebrow}</div>
            <h1 className="text-[clamp(36px,5.5vw,72px)] tracking-[0.02em]">{project.title}</h1>
          </div>
          <Badge>{project.year}</Badge>
        </div>
        {main && (
          <div className="relative aspect-[3/2] overflow-hidden bg-warm-gray">
            <Image src={main.src} alt={main.alt} fill priority sizes="(min-width: 1280px) 1152px, 100vw" className="object-cover" />
          </div>
        )}
      </section>

      <section className="container-page grid items-start gap-[clamp(32px,6vw,96px)] py-[clamp(40px,6vw,80px)] md:grid-cols-2">
        <p className="text-[clamp(18px,2vw,22px)] font-light leading-[1.9] text-black text-pretty">{project.summary}</p>
        <dl className="border-t border-warm-gray">
          {meta.map((m) => (
            <div key={m.k} className="flex justify-between gap-6 border-b border-surface-hover py-[13px] text-sm">
              <dt className="text-ink-3">{m.k}</dt>
              <dd className="text-black">{m.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {rest.length > 0 && (
        <section className="container-page pb-[clamp(56px,8vw,112px)]">
          <div className="columns-1 gap-[clamp(16px,2vw,28px)] sm:columns-2">
            {rest.map((img) => (
              <Image
                key={img.src}
                src={img.src}
                alt={img.alt}
                width={img.width}
                height={img.height}
                sizes="(min-width: 1280px) 576px, (min-width: 640px) 50vw, 100vw"
                className="mb-[clamp(16px,2vw,28px)] block h-auto w-full break-inside-avoid bg-warm-gray"
              />
            ))}
          </div>
        </section>
      )}

      <ContactCta />
    </>
  );
}
