import type { Metadata } from "next";
import { ContactCta } from "@/components/layout/ContactCta";
import { PageHeader } from "@/components/layout/PageHeader";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "關於",
  description: "認識沆設計 haus by hang. 的設計理念。",
};

// 暫時版本：只用已定案的品牌文字。團隊與負責人介紹等內容確認後再補。
export default function Page() {
  return (
    <>
      <PageHeader eyebrow="About" title="關於沆設計" />
      <section className="container-page grid gap-[clamp(32px,6vw,96px)] border-t border-warm-gray pb-[clamp(56px,8vw,112px)] pt-[clamp(40px,6vw,80px)] md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-2">
          <div className="eyebrow">Philosophy</div>
          <div className="text-[clamp(20px,2.2vw,26px)] text-black">{site.tagline}</div>
          <div className="text-base tracking-[0.06em] text-ink-2">{site.taglineZh}</div>
        </div>
        <p className="text-[clamp(18px,2vw,24px)] font-light leading-[1.75] text-black text-pretty">
          沆設計秉持形隨機能的初衷，以「設計順應生活，而非強迫生活適應設計」，在務實機能與情感溫度之間取得平衡，讓空間能隨時間流變，承載生活的軌跡。
        </p>
      </section>
      <ContactCta />
    </>
  );
}
