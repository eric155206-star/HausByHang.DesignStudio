/**
 * 服務項目（暫存）。文案取自設計稿，設計稿註明為草稿，待沆設計確認。
 * 「建築規劃」已確認不提供，不要加入。
 */
export type Service = {
  num: string;
  name: string;
  en: string;
  /** 首頁摘要用的短述 */
  short: string;
  body: string;
  items: string[];
  /** 示意照片，沒有時顯示佔位 */
  image?: { src: string; alt: string };
};

export const servicesIntro = "從住宅到商業空間，我們從使用者的日常出發，讓機能與情感在空間裡各得其所。";

export const services: Service[] = [
  {
    num: "01",
    name: "住宅室內設計",
    en: "Residential Interior",
    short: "從家人的作息出發，規劃動線、收納與光線，讓家跟著生活一起長大。",
    body: "從家人的作息出發，梳理動線、收納與採光。我們重視每個角落實際被使用的方式，讓空間在日常中自然運作，並保留隨家庭階段調整的彈性。",
    items: ["新成屋", "中古屋", "預售屋客變"],
    image: { src: "/projects/banqiao-sanmin/07.jpg", alt: "住宅室內設計 — 板橋三民路" },
  },
  {
    num: "02",
    name: "商業空間設計",
    en: "Commercial Space",
    short: "以品牌與營運需求為核心，兼顧顧客體驗與後場效率。",
    body: "以品牌精神與營運需求為核心，同時照顧顧客的體驗與工作人員的效率。從平面配置、材質到燈光，讓空間本身成為品牌的一部分。",
    items: ["餐飲", "零售", "診所", "辦公室"],
  },
  {
    num: "03",
    name: "老屋翻新",
    en: "Renovation",
    short: "評估結構與管線，保留值得留下的痕跡，讓老房子重新適合生活。",
    body: "完整評估結構、防水與管線狀況，保留值得留下的空間記憶，再以符合現代生活的機能重新安排，讓老房子安心住下一個三十年。",
    items: ["結構評估", "管線更新", "格局調整"],
  },
];
