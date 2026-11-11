import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { author, notoSansTC } from "@/lib/fonts";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "haus by hang. 沆設計｜老屋翻新與住宅室內設計",
    template: "%s｜haus by hang. 沆設計",
  },
  description: "沆設計 haus by hang.，以設計形塑生活的流變。專注老屋翻新、住宅與商業空間室內設計。",
  openGraph: {
    siteName: "haus by hang. 沆設計",
    locale: "zh_TW",
    type: "website",
  },
};

export const viewport: Viewport = {
  // 手機瀏覽器網址列顏色 = WARM GRAY C（與 Header 同色）。metadata 無法讀 CSS token，只能寫色碼
  themeColor: "#ded3c9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant-TW" className={`${author.variable} ${notoSansTC.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
