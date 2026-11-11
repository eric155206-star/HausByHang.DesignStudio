import Link from "next/link";

/** 區塊標題列：左 H2，右側文字連結（例如「全部作品 →」）。 */
export function SectionHeading({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-warm-gray pb-4">
      <h2 className="text-[clamp(24px,3vw,34px)]">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="text-sm font-medium text-link hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
