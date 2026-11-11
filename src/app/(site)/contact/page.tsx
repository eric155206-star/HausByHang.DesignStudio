import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "預約諮詢",
  description: "告訴我們您的空間與期待，我們會在兩個工作天內與您聯繫，安排初步諮詢。",
};

const contactInfo = [
  { k: "Email", v: site.email, href: `mailto:${site.email}` },
  { k: "Instagram", v: "@haus_by_hang_designstudio", href: site.instagram },
];

export default function ContactPage() {
  return (
    <section className="container-page grid items-start gap-[clamp(36px,6vw,96px)] pb-[clamp(56px,8vw,112px)] pt-[clamp(40px,6vw,80px)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="flex flex-col gap-6 lg:sticky lg:top-28">
        <div className="eyebrow">Contact</div>
        <h1 className="text-[clamp(36px,5vw,64px)] tracking-[0.02em]">預約諮詢</h1>
        <p className="max-w-[30em] text-base leading-[1.9] text-ink-2">
          告訴我們您的空間與期待。收到需求後，我們會在兩個工作天內與您聯繫，安排初步諮詢。
        </p>
        <dl className="mt-2 border-t border-warm-gray">
          {contactInfo.map((c) => (
            <div key={c.k} className="flex justify-between gap-6 border-b border-surface-hover py-[13px] text-sm">
              <dt className="text-ink-3">{c.k}</dt>
              <dd>
                <a href={c.href} className="text-black hover:text-link hover:underline" target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  {c.v}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="border border-warm-gray bg-white p-[clamp(24px,3vw,40px)]">
        <ContactForm />
      </div>
    </section>
  );
}
