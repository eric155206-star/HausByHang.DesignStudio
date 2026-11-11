import { ButtonLink } from "@/components/ui/Button";
import { contactHref } from "@/lib/site";

/** 聯絡頁以外，每頁底部的預約諮詢區塊。 */
export function ContactCta() {
  return (
    <section className="border-t border-warm-gray bg-white">
      <div className="container-page flex flex-col items-center gap-6 py-[clamp(56px,8vw,104px)] text-center">
        <h2 className="text-[clamp(26px,3.4vw,44px)] tracking-[0.02em] text-black">
          有一個空間，正在等待被好好規劃嗎？
        </h2>
        <ButtonLink href={contactHref} size="lg" arrow>
          預約諮詢
        </ButtonLink>
      </div>
    </section>
  );
}
