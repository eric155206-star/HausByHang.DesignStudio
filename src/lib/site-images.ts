/**
 * 網站上可以從後台更換的圖片位置。新增位置只要在這裡加一筆，不用改資料表。
 * slot 對應資料表 site_images 的主鍵。
 */
export type SiteImageTab = "home" | "services";

export type SiteImageSlot = {
  slot: string;
  tab: SiteImageTab;
  label: string;
  /** 後台提示：用在哪裡、建議比例 */
  hint: string;
  /** 後台預覽框比例，跟前台裁切一致 */
  aspect: string;
};

export const siteImageTabs: { key: SiteImageTab; label: string }[] = [
  { key: "home", label: "首頁" },
  { key: "services", label: "服務項目" },
];

export const siteImageSlots: SiteImageSlot[] = [
  {
    slot: "home-hero",
    tab: "home",
    label: "首頁主視覺",
    hint: "首頁最上方的大圖。電腦裁成 2:1 橫幅、手機裁成 4:3，建議用橫式照片。沒有設定時，自動使用首頁精選作品的主圖。",
    aspect: "aspect-[2/1]",
  },
  {
    slot: "service-residential",
    tab: "services",
    label: "住宅室內設計",
    hint: "服務項目頁的示意照片，裁成 4:3。",
    aspect: "aspect-[4/3]",
  },
  {
    slot: "service-commercial",
    tab: "services",
    label: "商業空間設計",
    hint: "服務項目頁的示意照片，裁成 4:3。",
    aspect: "aspect-[4/3]",
  },
  {
    slot: "service-renovation",
    tab: "services",
    label: "老屋翻新",
    hint: "服務項目頁的示意照片，裁成 4:3。",
    aspect: "aspect-[4/3]",
  },
];

export const siteImageSlotKeys = siteImageSlots.map((s) => s.slot);
