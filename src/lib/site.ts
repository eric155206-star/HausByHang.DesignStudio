/** 全站共用的品牌與導覽設定。之後聯絡資訊會改由後台管理。 */
export const site = {
  name: "haus by hang.",
  nameZh: "沆設計",
  url: "https://hausbyhang.com",
  tagline: "Design the Flow of Living",
  taglineZh: "以設計，形塑生活的流變。",
  email: "hanginteriorstudio@gmail.com",
  instagram: "https://www.instagram.com/haus_by_hang_designstudio/",
} as const;

export type NavItem = { href: string; label: string };

/** 主導覽。「預約諮詢」另外做成按鈕，不放在這裡。 */
export const mainNav: NavItem[] = [
  { href: "/projects", label: "作品集" },
  { href: "/services", label: "服務項目" },
  { href: "/process", label: "設計流程" },
  { href: "/blog", label: "文章" },
  { href: "/about", label: "關於" },
];

export const contactHref = "/contact";
