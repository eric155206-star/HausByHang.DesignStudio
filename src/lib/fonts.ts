import localFont from "next/font/local";
import { Noto_Sans_TC } from "next/font/google";

/*
 * 字重對應 CIS 手冊 p.35–36。
 * 手冊裡同一個層級，英文與中文用的字重不同（例如內文：Author Medium ＋ 思源黑體 Regular）。
 * 為了讓中英混排時只寫一個 font-weight 就對，Author 的字型檔刻意對應到「CSS 字重」：
 *
 *   CSS 字重      層級       英文 Author    中文 思源黑體
 *   300 light     標注字     Regular        Light
 *   400 normal    內文       Medium         Regular
 *   500 medium    副標題     SemiBold       Medium
 *   600 semibold  標題       SemiBold       SemiBold
 */
export const author = localFont({
  src: [
    { path: "../fonts/Author-Regular.otf", weight: "300", style: "normal" },
    { path: "../fonts/Author-Medium.otf", weight: "400", style: "normal" },
    { path: "../fonts/Author-Semibold.otf", weight: "500", style: "normal" },
    { path: "../fonts/Author-Semibold.otf", weight: "600", style: "normal" },
  ],
  variable: "--font-author",
  display: "swap",
});

export const notoSansTC = Noto_Sans_TC({
  weight: ["300", "400", "500", "600"],
  variable: "--font-noto-tc",
  display: "swap",
  // 中文字型檔很大，Google Fonts 會依實際用到的字切片下載，不需預先載入
  preload: false,
});
