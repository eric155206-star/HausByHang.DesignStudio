import Image from "next/image";
import Link from "next/link";
import { ContactCta } from "@/components/layout/ContactCta";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { ProjectCard } from "@/components/project/ProjectCard";
import { ButtonLink } from "@/components/ui/Button";
import { processSteps } from "@/content/process";
import { categoryLabel, projects } from "@/content/projects";
import { services } from "@/content/services";
import { contactHref, site } from "@/lib/site";

export default function HomePage() {
  const featured = projects.filter((p) => p.featured).slice(0, 3);
  const heroProject = featured.find((p) => p.hero) ?? projects.find((p) => p.hero);

  return (
    <>
      {/* 1. 主視覺 */}
      {heroProject?.hero && (
        <section className="container-page pt-[clamp(28px,4vw,48px)]">
          <Link
            href={`/projects/${heroProject.slug}`}
            aria-label={heroProject.title}
            className="group relative block aspect-[4/3] overflow-hidden bg-warm-gray md:aspect-[2/1]"
          >
            <Image
              src={heroProject.hero.src}
              alt={heroProject.hero.alt}
              fill
              priority
              sizes="(min-width: 1280px) 1152px, 100vw"
              className="object-cover transition-transform duration-[720ms] ease-brand group-hover:scale-[1.02]"
            />
          </Link>
          <div className="flex justify-between gap-4 pt-3 text-xs tracking-[0.06em] text-ink-3">
            <span>
              {heroProject.title} · {categoryLabel[heroProject.category]}
            </span>
            <span>{heroProject.location}</span>
          </div>
        </section>
      )}

      {/* 2. 標語 */}
      <section className="container-page grid gap-[clamp(32px,6vw,96px)] pb-[clamp(56px,8vw,112px)] pt-[clamp(40px,6vw,80px)] md:grid-cols-2 md:items-end">
        <div className="flex flex-col gap-5">
          <div className="eyebrow">沆設計 · Interior Design</div>
          <h1 className="text-[clamp(40px,6.4vw,84px)] leading-[1.02] tracking-[-0.02em]">{site.tagline}</h1>
          <p className="text-[clamp(20px,2.2vw,28px)] font-light tracking-[0.06em] text-black">{site.taglineZh}</p>
        </div>
        <div className="flex flex-col items-start gap-7">
          <p className="max-w-[34em] text-base leading-[1.9] text-ink-2 text-pretty">
            沆設計秉持形隨機能的初衷，以「設計順應生活，而非強迫生活適應設計」，在務實機能與情感溫度之間取得平衡，讓空間能隨時間流變，承載生活的軌跡。
          </p>
          <ButtonLink href={contactHref} size="lg" arrow>
            預約諮詢
          </ButtonLink>
        </div>
      </section>

      {/* 3. 精選作品 */}
      {featured.length > 0 && (
        <section className="container-page flex flex-col gap-9 pb-[clamp(56px,8vw,112px)]">
          <SectionHeading title="精選作品" href="/projects" linkLabel="全部作品" />
          <div className="grid gap-[clamp(20px,3vw,40px)] sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </section>
      )}

      {/* 4. 服務項目摘要 */}
      <section className="border-t border-warm-gray py-[clamp(56px,8vw,112px)]">
        <div className="container-page flex flex-col gap-10">
          <SectionHeading title="服務項目" href="/services" linkLabel="了解更多" />
          <div className="grid md:grid-cols-3">
            {services.map((s) => (
              <div key={s.num} className="flex flex-col gap-3 pb-2 pr-6 pt-7">
                <div className="text-xs tracking-[0.14em] text-ink-4 tabular-nums">{s.num}</div>
                <h3 className="text-xl">{s.name}</h3>
                <p className="text-[14.5px] leading-[1.8] text-ink-2">{s.short}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 設計流程摘要 */}
      <section className="border-t border-warm-gray py-[clamp(56px,8vw,96px)]">
        <div className="container-page flex flex-col gap-10">
          <SectionHeading title="設計流程" href="/process" linkLabel="完整流程" />
          <ol className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-6">
            {processSteps.map((s) => (
              <li key={s.num} className="flex flex-col gap-2.5 border-t-[1.5px] border-black pt-4">
                <div className="text-xs tracking-[0.14em] text-ink-4 tabular-nums">STEP {s.num}</div>
                <div className="text-[17px] text-black">{s.name}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ContactCta />
    </>
  );
}
