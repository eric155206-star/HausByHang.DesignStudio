import type { Metadata } from "next";
import Image from "next/image";
import { ContactCta } from "@/components/layout/ContactCta";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { services, servicesIntro } from "@/content/services";
import { getSiteImages } from "@/lib/data/site-images";

export const metadata: Metadata = {
  title: "服務項目",
  description: "住宅室內設計、商業空間設計與老屋翻新。",
};

export default async function Page() {
  const siteImages = await getSiteImages();
  return (
    <>
      <PageHeader eyebrow="Services" title="服務項目" aside={servicesIntro} />
      <section className="container-page pb-[clamp(56px,8vw,112px)]">
        {services.map((s) => {
          const image = siteImages[s.slot] ?? s.image;
          return (
          <article
            key={s.num}
            className="grid items-start gap-x-[clamp(32px,5vw,72px)] gap-y-6 border-t border-warm-gray py-[clamp(32px,4vw,56px)] md:grid-cols-2 lg:grid-cols-3"
          >
            <div className="flex items-baseline gap-5">
              <span className="text-[13px] text-ink-4 tabular-nums">{s.num}</span>
              <div className="flex flex-col gap-1.5">
                <h2 className="text-[clamp(24px,2.6vw,32px)]">{s.name}</h2>
                <div className="eyebrow">{s.en}</div>
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <p className="text-[15.5px] leading-[1.9] text-ink-2 text-pretty">{s.body}</p>
              <div className="flex flex-wrap gap-2">
                {s.items.map((it) => (
                  <Badge key={it}>{it}</Badge>
                ))}
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden bg-surface md:col-span-2 lg:col-span-1">
              {image ? (
                <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 360px, 100vw" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Image src="/brand/mark.png" alt="" width={40} height={40} className="opacity-[0.09]" />
                  <span className="absolute bottom-3 left-3.5 text-[10.5px] tracking-[0.14em] text-ink-4">{s.name} · 示意照片</span>
                </div>
              )}
            </div>
          </article>
          );
        })}
      </section>
      <ContactCta />
    </>
  );
}
