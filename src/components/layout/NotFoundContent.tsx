import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import mark from "../../../public/brand/mark.png";

/** 404 內容，前台頁面裡的 notFound() 與不存在的網址共用。 */
export function NotFoundContent() {
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-8 py-20 text-center">
      <Image src={mark} alt="" className="h-16 w-16 mix-blend-multiply" sizes="64px" />
      <div className="flex flex-col gap-3">
        <div className="eyebrow">404</div>
        <h1 className="text-[clamp(26px,3.4vw,40px)] tracking-[0.02em]">這個空間還在規劃中。</h1>
        <p className="text-sm text-ink-3">您要找的頁面不存在，或已經移動到其他位置。</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href="/" size="lg">
          回首頁
        </ButtonLink>
        <ButtonLink href="/projects" size="lg" variant="secondary">
          看作品
        </ButtonLink>
      </div>
    </section>
  );
}
