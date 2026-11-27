import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { ContactCta } from "@/components/layout/ContactCta";
import { ProjectCard } from "@/components/project/ProjectCard";
import { FrameGrid, ParenLabel } from "@/components/ui/FrameCard";
import { processSteps } from "@/content/process";
import { getPublishedProjects } from "@/lib/data/projects";
import { getSiteImages, type SiteImage } from "@/lib/data/site-images";
import { services } from "@/content/services";
import { contactHref, site } from "@/lib/site";

/**
 * 首頁主視覺。後台有另外裁手機版時用 <picture> 做「藝術指導」：
 * 手機載入 4:3 那張、平板以上載入 2:1 那張，瀏覽器只會下載用得到的那一張。
 */
function HeroImage({ image }: { image: SiteImage }) {
  const className = "absolute inset-0 h-full w-full object-cover";
  if (!image.mobile) {
    return <Image src={image.src} alt={image.alt} fill priority quality={90} sizes="100vw" className="object-cover" />;
  }
  const { props: desktop } = getImageProps({
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    sizes: "100vw",
    quality: 90,
  });
  const { props: mobile } = getImageProps({
    src: image.mobile.src,
    alt: image.alt,
    width: image.mobile.width,
    height: image.mobile.height,
    sizes: "100vw",
    quality: 90,
    priority: true,
  });
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktop.srcSet} sizes={desktop.sizes} />
      {/* 這裡用原生 img：srcSet 由 getImageProps 產生，仍然走 Next.js 的圖片最佳化 */}
      <img {...mobile} alt={image.alt} className={className} style={undefined} />
    </picture>
  );
}

export default async function HomePage() {
  const [projects, siteImages] = await Promise.all([getPublishedProjects(), getSiteImages()]);
  // 後台「網站圖片」有設定首頁主視覺時優先使用，否則用精選作品的主圖
  const customHero = siteImages["home-hero"];
  const featured = projects.filter((p) => p.featured).slice(0, 3);
  const heroProject = featured.find((p) => p.hero) ?? projects.find((p) => p.hero);

  const info = [
    { k: "Services", v: "住宅 · 商業空間 · 老屋翻新" },
    { k: "Area", v: "台北 · 新北 · 桃園" },
  ];
  const rowClass = "flex items-center justify-between gap-6 border-b border-black py-3 text-base font-medium";
  const moreLink = "self-start text-[15px] font-medium tracking-[0.06em] text-black underline underline-offset-4 hover:no-underline";

  return (
    <div className="bg-surface">
      {/* 1. 標語與基本資訊 */}
      <section className="container-page grid gap-x-[clamp(32px,6vw,96px)] gap-y-8 pb-[clamp(28px,4vw,48px)] pt-[clamp(8px,2vw,24px)] md:grid-cols-[1.9fr_1fr] md:items-end">
        <div className="flex flex-col gap-4">
          <h1 className="text-[clamp(44px,7vw,104px)] leading-[0.98] tracking-[-0.03em]">{site.tagline}</h1>
          <p className="max-w-[22em] text-[clamp(20px,2.4vw,32px)] font-medium leading-[1.35] text-black text-pretty">
            {site.taglineZh}設計順應生活，而非強迫生活適應設計。
          </p>
        </div>
        <dl className="border-t border-black">
          {info.map((r) => (
            <div key={r.k} className={rowClass}>
              <dt>
                <ParenLabel>{r.k}</ParenLabel>
              </dt>
              <dd className="text-right text-black">{r.v}</dd>
            </div>
          ))}
          <div className={rowClass}>
            <dt>
              <ParenLabel>Instagram</ParenLabel>
            </dt>
            <dd>
              <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="text-black hover:underline">
                @haus_by_hang_designstudio
              </a>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-6 py-3 text-base font-medium">
            <dt>
              <ParenLabel>Contact</ParenLabel>
            </dt>
            <dd>
              <Link href={contactHref} className="inline-block rounded-full bg-black px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-ink">
                預約諮詢 →
              </Link>
            </dd>
          </div>
        </dl>
      </section>

      {/* 2. 滿版主視覺：後台「網站圖片」有設定時優先，否則用精選作品的主圖 */}
      {customHero ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-warm-gray md:aspect-[2/1]">
          <HeroImage image={customHero} />
        </div>
      ) : (
        heroProject?.hero && (
          <Link
            href={`/projects/${heroProject.slug}`}
            aria-label={heroProject.title}
            className="relative block aspect-[4/3] w-full overflow-hidden bg-warm-gray md:aspect-[2/1]"
          >
            <Image src={heroProject.hero.src} alt={heroProject.hero.alt} fill priority quality={90} sizes="100vw" className="object-cover" />
          </Link>
        )
      )}

      {/* 3. 理念、服務項目、設計流程 */}
      <section className="container-page grid gap-x-10 gap-y-6 py-[clamp(40px,6vw,80px)] md:grid-cols-[1fr_2.2fr]">
        <div className="flex items-start justify-between md:border-r md:border-black md:pr-6">
          <ParenLabel>About</ParenLabel>
          <span aria-hidden className="hidden text-base text-black md:inline">
            ↘
          </span>
        </div>
        <div className="flex flex-col">
          <div className="flex flex-col gap-3 pb-9">
            <ParenLabel>Philosophy</ParenLabel>
            <h2 className="text-[clamp(24px,2.6vw,34px)]">形隨機能，順應生活</h2>
            <p className="max-w-[46em] text-base leading-[1.9] text-ink-2 text-pretty">
              沆設計秉持形隨機能的初衷，以「設計順應生活，而非強迫生活適應設計」，在務實機能與情感溫度之間取得平衡，讓空間能隨時間流變，承載生活的軌跡。
            </p>
          </div>
          <div className="flex flex-col gap-4 border-t border-black py-9">
            <ParenLabel>Services</ParenLabel>
            <h2 className="text-[clamp(24px,2.6vw,34px)]">服務項目</h2>
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-3">
              {services.map((s) => (
                <div key={s.num} className="flex flex-col gap-1.5">
                  <h3 className="text-[17px]">{s.name}</h3>
                  <p className="text-[15px] leading-[1.8] text-ink-2">{s.short}</p>
                </div>
              ))}
            </div>
            <Link href="/services" className={moreLink}>
              了解更多
            </Link>
          </div>
          <div className="flex flex-col gap-4 border-t border-black pt-9">
            <ParenLabel>Process</ParenLabel>
            <h2 className="text-[clamp(24px,2.6vw,34px)]">設計流程</h2>
            <ol className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {processSteps.map((s) => (
                <li key={s.num} className="flex gap-3 text-base font-medium text-black">
                  <span className="text-ink-4 tabular-nums">{s.num}</span>
                  {s.name}
                </li>
              ))}
            </ol>
            <Link href="/process" className={moreLink}>
              完整流程
            </Link>
          </div>
        </div>
      </section>

      {/* 4. 精選作品 */}
      {featured.length > 0 && (
        <section className="container-page pb-[clamp(56px,8vw,112px)]">
          <div className="flex items-baseline justify-between pb-5">
            <h2 className="text-base font-medium tracking-[0.02em] text-black">(Selected Works)</h2>
            <Link href="/projects" className={moreLink}>
              全部作品
            </Link>
          </div>
          <FrameGrid>
            {featured.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </FrameGrid>
        </section>
      )}

      <ContactCta />
    </div>
  );
}
