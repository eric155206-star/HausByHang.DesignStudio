/**
 * 網站上可以從後台更換的圖片位置。新增位置只要在這裡加一筆，不用改資料表。
 * slot 對應資料表 site_images 的主鍵。
 */
export type SiteImageTab = "home" | "services";

/** 一個位置要裁的版本。desktop 是主要版本（存 image_path），mobile 是手機版（存 mobile_image_path）。 */
export type SiteImageCrop = {
  key: "desktop" | "mobile";
  label: string;
  /** 寬 ÷ 高，要跟前台顯示的比例一致 */
  ratio: number;
};

export type SiteImageSlot = {
  slot: string;
  tab: SiteImageTab;
  label: string;
  /** 後台提示：用在哪裡、建議比例 */
  hint: string;
  /** 後台預覽框比例，跟前台裁切一致 */
  aspect: string;
  /** 上傳時依序要裁的版本，第一個一定是 desktop */
  crops: SiteImageCrop[];
};

const single43: SiteImageCrop[] = [{ key: "desktop", label: "4:3", ratio: 4 / 3 }];

export const siteImageTabs: { key: SiteImageTab; label: string }[] = [
  { key: "home", label: "首頁" },
  { key: "services", label: "服務項目" },
];

export const siteImageSlots: SiteImageSlot[] = [
  {
    slot: "home-hero",
    tab: "home",
    label: "首頁主視覺",
    hint: "首頁最上方的大圖。上傳時分別框出電腦版（2:1 橫幅）和手機版（4:3）要顯示的範圍。沒有設定時，自動使用首頁精選作品的主圖。",
    aspect: "aspect-[2/1]",
    crops: [
      { key: "desktop", label: "電腦版 2:1", ratio: 2 },
      { key: "mobile", label: "手機版 4:3", ratio: 4 / 3 },
    ],
  },
  {
    slot: "service-residential",
    tab: "services",
    label: "住宅室內設計",
    hint: "服務項目頁的示意照片，上傳時框出 4:3 的顯示範圍。",
    aspect: "aspect-[4/3]",
    crops: single43,
  },
  {
    slot: "service-commercial",
    tab: "services",
    label: "商業空間設計",
    hint: "服務項目頁的示意照片，上傳時框出 4:3 的顯示範圍。",
    aspect: "aspect-[4/3]",
    crops: single43,
  },
  {
    slot: "service-renovation",
    tab: "services",
    label: "老屋翻新",
    hint: "服務項目頁的示意照片，上傳時框出 4:3 的顯示範圍。",
    aspect: "aspect-[4/3]",
    crops: single43,
  },
];

export const siteImageSlotKeys = siteImageSlots.map((s) => s.slot);
