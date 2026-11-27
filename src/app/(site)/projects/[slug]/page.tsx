import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCta } from "@/components/layout/ContactCta";
import { ParenLabel } from "@/components/ui/FrameCard";
import { categoryLabel, type ProjectImage } from "@/content/projects";
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

/**
 * 把照片排成一列一列：同一列的照片等高、寬度照原比例分配，直式橫式混排也不用裁切。
 * 每列的「寬高比總和」湊到約 TARGET 就換列；最後一列湊不滿時用空白補齊，避免照片被放得過大。
 */
const ROW_TARGET = 4.2;
function toRows(images: ProjectImage[]) {
  const rows: { items: ProjectImage[]; pad: number }[] = [];
  let items: ProjectImage[] = [];
  let sum = 0;
  for (const img of images) {
    items.push(img);
    sum += img.width / img.height;
    if (sum >= ROW_TARGET - 0.7) {
      rows.push({ items, pad: 0 });
      items = [];
      sum = 0;
    }
  }
  if (items.length) rows.push({ items, pad: Math.max(0, ROW_TARGET - sum) });
  return rows;
}

function PhotoRow({ row }: { row: ReturnType<typeof toRows>[number] }) {
  return (
    <div className="flex flex-col gap-[clamp(12px,1.4vw,24px)] md:flex-row">
      {row.items.map((img) => (
        <div
          key={img.src}
          className="relative w-full overflow-hidden bg-warm-gray md:w-auto md:[flex:var(--r)]"
          style={{ aspectRatio: `${img.width} / ${img.height}`, "--r": img.width / img.height } as React.CSSProperties}
        >
          <Image src={img.src} alt={img.alt} fill quality={90} sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
        </div>
      ))}
      {row.pad > 0 && <div aria-hidden className="hidden md:block md:[flex:var(--r)]" style={{ "--r": row.pad } as React.CSSProperties} />}
    </div>
  );
}

const sectionClass = "container-page";
const ruleClass = "border-t border-black";
const headingClass = "text-[clamp(30px,3.4vw,68px)] font-medium uppercase leading-none tracking-[0.01em]";

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) notFound();

  // 右側主圖用封面；左側小圖用第一張橫式照片；其餘照片排進照片列
  const main = project.cover;
  const side = project.gallery.find((g) => g.width > g.height && g.src !== main.src);
  const photos = project.gallery.filter((g) => g.src !== main.src && g !== side);
  const [firstRow, ...moreRows] = toRows(photos);
  const total = String(project.gallery.length).padStart(2, "0");
  const meta = [
    { k: "Location", zh: "地點", v: project.location },
    { k: "Type", zh: "類型", v: [categoryLabel[project.category], ...project.tags].join(" · ") },
    { k: "Area", zh: "坪數", v: project.area ? `${project.area} 坪` : "—" },
    { k: "Year", zh: "完工", v: project.year ? String(project.year) : "—" },
  ];

  return (
    <div className="bg-surface">
      {/* 1. 大標題、小資訊、右側主圖 */}
      <section className={`${sectionClass} pb-[clamp(36px,5vw,72px)] pt-[clamp(8px,2vw,24px)]`}>
        <div className="grid gap-x-[clamp(24px,3.4vw,64px)] gap-y-8 md:grid-cols-[1fr_1.7fr_2fr]">
          <div className="hidden md:flex md:flex-col md:justify-center">
            {side && (
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-warm-gray">
                <Image src={side.src} alt={side.alt} fill quality={90} sizes="20vw" className="object-cover" />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between gap-10 md:py-[clamp(24px,5vw,96px)]">
            <div className="flex flex-col gap-5">
              <Link href="/projects" className="self-start text-[clamp(15px,1.1vw,19px)] font-medium text-black underline underline-offset-4 hover:no-underline">
                ← 作品集
              </Link>
              {project.eyebrow && <ParenLabel>{project.eyebrow}</ParenLabel>}
              <h1 className="text-[clamp(44px,6vw,132px)] leading-[1.05] tracking-[-0.01em]">{project.title}</h1>
            </div>
            <div className="flex max-w-[22em] flex-col gap-4">
              <div className="flex items-center gap-3 text-[clamp(16px,1.2vw,22px)] font-medium tabular-nums text-black">
                01 <span aria-hidden className="h-px w-10 bg-black" /> {total}
              </div>
              {project.summary && <p className="text-[clamp(16px,1.2vw,22px)] font-medium leading-[1.8] text-ink-2 text-pretty">{project.summary}</p>}
            </div>
          </div>
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-warm-gray md:aspect-auto md:min-h-[min(82vh,58vw)]">
            <Image src={main.src} alt={main.alt} fill priority quality={90} sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* 2. 案例說明：左小標、右內文 */}
      {project.description && (
        <section className={sectionClass}>
          <div className={`${ruleClass} flex flex-col gap-[clamp(24px,3vw,48px)] py-[clamp(36px,5vw,72px)]`}>
            <h2 className={headingClass}>About</h2>
            <div className="grid gap-x-[clamp(32px,6vw,96px)] gap-y-5 md:grid-cols-[1fr_1.6fr]">
              <p className="text-[clamp(18px,1.5vw,28px)] font-semibold leading-[1.6] text-black text-pretty">{project.summary}</p>
              <p className="whitespace-pre-line text-[clamp(16px,1.2vw,22px)] leading-[2] text-ink-2 text-pretty">{project.description}</p>
            </div>
          </div>
        </section>
      )}

      {/* 3. 第一列照片 */}
      {firstRow && (
        <section className={sectionClass}>
          <div className={`${ruleClass} grid gap-x-[clamp(24px,3vw,56px)] gap-y-5 py-[clamp(28px,4vw,56px)] md:grid-cols-[1fr_5fr]`}>
            <ParenLabel>Gallery</ParenLabel>
            <PhotoRow row={firstRow} />
          </div>
        </section>
      )}

      {/* 4. 案件資訊：細線分隔的列表 */}
      <section className={sectionClass}>
        <div className={`${ruleClass} grid gap-x-[clamp(24px,3vw,56px)] gap-y-6 py-[clamp(36px,5vw,72px)] md:grid-cols-[1fr_1.6fr]`}>
          <h2 className={headingClass}>Details</h2>
          <dl className="border-t border-black">
            {meta.map((m) => (
              <div key={m.k} className="grid grid-cols-[5.5em_1fr_auto] items-baseline gap-4 border-b border-black py-[0.9em] text-[clamp(16px,1.2vw,22px)] font-medium">
                <dt className="text-ink-4">{m.k}</dt>
                <dd className="text-black">{m.v}</dd>
                <span aria-hidden className="text-ink-3">{m.zh}</span>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 5. 其餘照片 */}
      {moreRows.length > 0 && (
        <section className={`${sectionClass} pb-[clamp(56px,8vw,112px)]`}>
          <div className={`${ruleClass} flex flex-col gap-[clamp(12px,1.4vw,24px)] pt-[clamp(28px,4vw,56px)]`}>
            {moreRows.map((row) => (
              <PhotoRow key={row.items[0].src} row={row} />
            ))}
          </div>
        </section>
      )}

      <ContactCta />
    </div>
  );
}
