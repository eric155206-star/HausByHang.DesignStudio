import { ContactCta } from "@/components/layout/ContactCta";
import { Placeholder } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { contactHref, site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <section className="container-page grid gap-10 py-[clamp(48px,7vw,96px)] md:grid-cols-2 md:items-end">
        <div className="flex flex-col gap-5">
          <div className="eyebrow">沆設計 · Interior Design</div>
          <h1 className="text-[clamp(40px,6.4vw,84px)] leading-[1.02] tracking-[-0.02em]">{site.tagline}</h1>
          <p className="text-[clamp(20px,2.2vw,28px)] font-light tracking-[0.06em] text-black">{site.taglineZh}</p>
        </div>
        <div className="flex flex-col items-start gap-8">
          <p className="text-base leading-[1.9] text-ink">
            沆設計秉持形隨機能的初衷，以「設計順應生活，而非強迫生活適應設計」，在務實機能與情感溫度之間取得平衡，讓空間能隨時間流變，承載生活的軌跡。
          </p>
          <ButtonLink href={contactHref} size="lg" arrow>
            預約諮詢
          </ButtonLink>
        </div>
      </section>
      <Placeholder>主視覺照片、精選作品、服務摘要將在下一步加入</Placeholder>
      <ContactCta />
    </>
  );
}
