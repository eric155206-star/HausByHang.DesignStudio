/**
 * 設計流程 6 步驟。文案由沆設計提供（2026-11-11「服務流程」圖）。
 * 首頁流程摘要與 /process 頁共用這份資料。
 */
export type ProcessStep = {
  num: string;
  name: string;
  en: string;
  body: string;
};

export const processIntro =
  "從需求討論到完工交付，以專業與細緻的流程，陪伴業主完整實現理想的居住空間。";

export const processSteps: ProcessStep[] = [
  {
    num: "01",
    name: "現場丈量與需求討論",
    en: "Site Visit & Consultation",
    body: "了解空間條件、生活習慣與風格需求，釐清機能重點與預算範圍。",
  },
  {
    num: "02",
    name: "空間提案",
    en: "Space Planning Proposal",
    body: "依據需求提出空間配置、動線與初步設計方向，確認整體規劃的可行性。",
  },
  {
    num: "03",
    name: "設計合約",
    en: "Design Agreement",
    body: "確認設計內容、服務範圍與時程，簽訂設計合約。",
  },
  {
    num: "04",
    name: "設計執行",
    en: "Design Development",
    body: "深化設計細節，包含立面、材質、色彩與設備選擇，完整確認施工圖說。",
  },
  {
    num: "05",
    name: "工程報價",
    en: "Construction Quotation",
    body: "依據確認的設計圖提供工程報價，說明施作項目與預算配置。",
  },
  {
    num: "06",
    name: "工程合約與施工",
    en: "Construction & Completion",
    body: "簽訂工程合約後進行施工，並由設計團隊全程監造、協調與品質把控，最後驗收交付。",
  },
];
