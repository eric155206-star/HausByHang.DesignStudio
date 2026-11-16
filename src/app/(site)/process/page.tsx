import type { Metadata } from "next";
import { ContactCta } from "@/components/layout/ContactCta";
import { PageHeader } from "@/components/layout/PageHeader";
import { processIntro, processSteps } from "@/content/process";

export const metadata: Metadata = {
  title: "設計流程",
  description: `${processIntro}從現場丈量與需求討論、空間提案、設計合約、設計執行、工程報價，到工程合約與施工。`,
};

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Service Process" title="設計流程" aside={processIntro} />

      <section className="container-page pb-[clamp(56px,8vw,112px)]">
        <ol>
          {processSteps.map((s) => (
            <li
              key={s.num}
              className="grid grid-cols-[44px_minmax(0,1fr)] md:grid-cols-[120px_minmax(0,1fr)] gap-[clamp(16px,4vw,56px)] border-t border-warm-gray py-[clamp(28px,3.4vw,44px)]"
            >
              <div
                aria-hidden
                className="text-[clamp(32px,4vw,52px)] font-light leading-none text-ink-4 tabular-nums"
              >
                {s.num}
              </div>
              <div className="grid gap-x-[clamp(24px,4vw,64px)] gap-y-3 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-[clamp(22px,2.4vw,28px)]">
                    <span className="sr-only">步驟 {s.num}：</span>
                    {s.name}
                  </h2>
                  <div className="eyebrow">{s.en}</div>
                </div>
                <p className="text-[15.5px] leading-[1.9] text-ink-2 text-pretty">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <ContactCta />
    </>
  );
}
