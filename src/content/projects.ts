/**
 * 作品資料型別，以及 Supabase 尚未設定時使用的暫存資料。
 * 設定好 Supabase 後，前台改讀資料庫（見 src/lib/data/projects.ts），這裡的資料就不再顯示。
 *
 * 只放真實案例：設計稿裡的「山居．白水」「餘白咖啡」等是假資料，不放上正式網站。
 */
export type ProjectCategory = "residential" | "commercial";

export const categoryLabel: Record<ProjectCategory, string> = {
  residential: "住宅",
  commercial: "商業空間",
};

export type ProjectImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export type Project = {
  slug: string;
  title: string;
  /** 英文小標，例如 Banqiao · Residence */
  eyebrow: string;
  location: string;
  category: ProjectCategory;
  /** 例如「老屋」 */
  tags: string[];
  /** 坪數，未提供時為 null */
  area: number | null;
  year: number | null;
  /** 卡片與 SEO 用短述 */
  summary: string;
  /** 作品內頁的案例描述 */
  description: string;
  /** 卡片封面（4:5 裁切顯示，寬高可為 0） */
  cover: ProjectImage;
  /** 首頁主視覺用的橫幅圖 */
  hero?: ProjectImage;
  gallery: ProjectImage[];
  featured: boolean;
};

const sanmin = (n: string, width: number, height: number, alt: string): ProjectImage => ({
  src: `/projects/banqiao-sanmin/${n}.jpg`,
  width,
  height,
  alt: `板橋三民路 — ${alt}`,
});

const W = 1302; // 橫幅照片原始寬度
const H = 868; // 所有照片原始高度

export const projects: Project[] = [
  {
    slug: "banqiao-sanmin",
    title: "板橋三民路",
    eyebrow: "Banqiao · Residence",
    location: "新北 板橋",
    category: "residential",
    tags: [],
    area: null,
    year: 2026,
    summary: "以低色溫的燈光與木質家具，串起客廳、餐廳與廚房。",
    description:
      "以低色溫的燈光與木質家具，串起客廳、餐廳與廚房。軌道燈保留日後調整的彈性，讓空間隨著屋主的生活習慣，慢慢長出自己的樣子。",
    cover: sanmin("04", 579, H, "封面"),
    hero: sanmin("12", W, H, "餐廳望向客廳"),
    gallery: [
      sanmin("03", W, H, "客廳望向餐廚"),
      sanmin("10", W, H, "空間照片 10"),
      sanmin("07", 1172, H, "空間照片 07"),
      sanmin("02", 579, H, "空間照片 02"),
      sanmin("08", W, H, "空間照片 08"),
      sanmin("13", 579, H, "空間照片 13"),
      sanmin("09", W, H, "空間照片 09"),
      sanmin("05", 579, H, "空間照片 05"),
      sanmin("14", 605, H, "空間照片 14"),
      sanmin("16", W, H, "空間照片 16"),
      sanmin("15", W, H, "空間照片 15"),
      sanmin("17", 1253, H, "空間照片 17"),
      sanmin("18", W, H, "空間照片 18"),
      sanmin("20", 644, H, "空間照片 20"),
    ],
    featured: true,
  },
];

