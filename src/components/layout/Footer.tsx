import Image from "next/image";
import Link from "next/link";
import { contactHref, mainNav, site } from "@/lib/site";
import logo from "../../../public/brand/logo-bilingual.png";

// TODO：地址、電話、LINE、服務時間待提供，之後改由後台管理
const contactInfo: Array<{ label: string; href?: string }> = [
  { label: site.email, href: `mailto:${site.email}` },
  { label: "Instagram", href: site.instagram },
];

export function Footer() {
  return (
    <footer className="border-t border-warm-gray bg-white px-[clamp(20px,5vw,64px)] pb-10 pt-[clamp(48px,8vw,96px)] text-black">
      <div className="flex flex-col gap-14">
        <div className="flex flex-wrap items-start justify-between gap-12">
          <div className="flex max-w-[380px] flex-col gap-5">
            <Image
              src={logo}
              alt="沆・設計 haus by hang."
              className="self-start"
              style={{ height: 40, width: "auto", maxWidth: "none" }}
              sizes="126px"
            />
            <p className="text-[14.5px] leading-[1.8] text-ink-2">
              {site.tagline}
              <br />
              {site.taglineZh}
            </p>
          </div>

          <div className="flex flex-wrap gap-16">
            <div className="flex flex-col gap-3.5">
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-3">網站導覽</div>
              {[...mainNav, { href: contactHref, label: "預約諮詢" }].map((item) => (
                <Link key={item.href} href={item.href} className="text-sm text-ink-2 hover:text-black">
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-3.5">
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-3">聯絡資訊</div>
              {contactInfo.map((c) =>
                c.href ? (
                  <a
                    key={c.label}
                    href={c.href}
                    className="text-sm text-ink-2 hover:text-black"
                    {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {c.label}
                  </a>
                ) : (
                  <div key={c.label} className="text-sm text-ink-2">
                    {c.label}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t border-warm-gray pt-[22px] text-xs text-ink-3">
          <span>© 2026 沆設計 haus by hang.</span>
          <span className="tracking-[0.1em]">TAIPEI · TAIWAN</span>
        </div>
      </div>
    </footer>
  );
}
