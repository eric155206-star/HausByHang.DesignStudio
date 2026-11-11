import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/** 前台共用版型：Header ＋ 內容 ＋ Footer。後台 /admin 不套用。 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
