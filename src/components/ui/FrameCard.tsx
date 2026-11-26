import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** 小標籤：括號包起來的英文小字，例如 (Selected Works)。 */
export function ParenLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("text-xs tracking-[0.04em] text-black", className)}>({children})</div>;
}

/**
 * 細線框格。每一格自己畫四邊框線，再往左上各疊 1px，相鄰的線就會合成一條；
 * 這樣最後一列沒排滿時，也不會多出一段沒有格子的線。
 */
export function FrameGrid({ children }: { children: ReactNode }) {
  return <div className="grid pl-px pt-px sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

/** 框格卡片：上方左邊日期或年份、右邊膠囊標籤，中間圖片，下方標題、簡述、READ MORE。作品與文章共用。 */
export function FrameCard({
  href,
  meta,
  tag,
  image,
  imageAspect = "aspect-[4/3]",
  title,
  text,
}: {
  href: string;
  meta?: ReactNode;
  tag?: string;
  image?: { src: string; alt: string } | null;
  imageAspect?: string;
  title: string;
  text?: string;
}) {
  return (
    <Link href={href} className="group -ml-px -mt-px flex flex-col gap-4 border border-black p-[clamp(18px,2.2vw,28px)]">
      <div className="flex min-h-[24px] items-center justify-between gap-3 text-xs text-black">
        <span className="tabular-nums">{meta}</span>
        {tag && <span className="rounded-full border border-black px-2.5 py-0.5 text-[11px] tracking-[0.06em]">{tag}</span>}
      </div>
      <div className={cn("relative overflow-hidden bg-warm-gray", imageAspect)}>
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            quality={90}
            sizes="(min-width: 1280px) 380px, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
            className="object-cover transition-transform duration-[720ms] ease-brand group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image src="/brand/mark.png" alt="" width={40} height={40} className="opacity-[0.12]" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-xl font-semibold leading-[1.45] text-black">{title}</div>
        {text && <p className="line-clamp-3 text-[13.5px] leading-[1.8] text-ink-2">{text}</p>}
      </div>
      <span className="mt-auto self-start pt-2 text-[11px] tracking-[0.1em] text-black underline underline-offset-4 group-hover:no-underline">
        READ MORE
      </span>
    </Link>
  );
}
