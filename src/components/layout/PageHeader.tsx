import type { ReactNode } from "react";

/** 內頁標題區：英文小標＋大標題，可選擇右側引言。 */
export function PageHeader({
  eyebrow,
  title,
  aside,
}: {
  eyebrow: string;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <section className="container-page grid gap-8 pb-[clamp(32px,4vw,56px)] pt-[clamp(40px,6vw,80px)] md:grid-cols-2 md:items-end">
      <div className="flex flex-col gap-4">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="text-[clamp(36px,5vw,64px)] tracking-[0.02em]">{title}</h1>
      </div>
      {aside && <div className="text-base leading-[1.9] text-ink-2">{aside}</div>}
    </section>
  );
}

/** 骨架階段的佔位內容，正式內容在下一步填入。 */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <section className="container-page pb-[clamp(56px,8vw,112px)]">
      <div className="flex min-h-[240px] items-center justify-center bg-surface px-6 text-center text-sm text-ink-3">
        {children}
      </div>
    </section>
  );
}
