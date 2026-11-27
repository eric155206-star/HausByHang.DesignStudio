/**
 * 詳細問卷（住宅）：基本資料送出後接著填的題目。
 * 題目來自原本的 Google 表單「裝修需求調查問卷」，扣掉基本資料已經問過的姓名、坪數、房屋類型、房屋現況。
 * 題目寫成一份清單，表單畫面、伺服器驗證、後台顯示、通知信都讀這一份，改題目只要改這裡。
 */

export type Question = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
} & (
  | { type: "text" }
  | { type: "textarea" }
  /** 單選；other 為 true 時最後多一個「其他」，選了要手動填寫 */
  | { type: "choice"; options: readonly string[]; other?: boolean }
  /** 線性量表，min 到 max 的整數 */
  | { type: "scale"; min: number; max: number; minLabel: string; maxLabel: string }
);

export type QuestionSection = { title: string; description: string; questions: Question[] };

export const OTHER = "其他";
const NO_GUESTS = "最好都不要有人來";

export const questionnaireSections: QuestionSection[] = [
  {
    title: "關於您與家人",
    description: "了解住的人，才能把空間規劃得貼近生活。",
    questions: [
      { id: "address", label: "裝修地址", type: "text", required: true, placeholder: "例如 新北市板橋區三民路二段" },
      { id: "stayYears", label: "預計居住年限", type: "choice", required: true, options: ["3 年", "5 年", "10 年"], other: true },
      { id: "age", label: "年齡", type: "text", required: true },
      { id: "gender", label: "性別", type: "choice", required: true, options: ["男", "女"], other: true },
      { id: "household", label: "居住成員人數", type: "text", required: true, placeholder: "例如 3 大 2 小" },
      { id: "hobbies", label: "興趣或嗜好", type: "textarea", required: true },
      { id: "colors", label: "喜歡的顏色", type: "text", required: true },
      {
        id: "soundSensitivity",
        label: "對聲音敏感嗎？",
        type: "scale",
        required: true,
        min: 1,
        max: 10,
        minLabel: "在路邊都睡得著",
        maxLabel: "東西掉到地上都會吵醒我",
      },
      { id: "lightSensitivity", label: "對光敏感嗎？", type: "scale", required: true, min: 1, max: 5, minLabel: "敏感", maxLabel: "不敏感" },
      { id: "diet", label: "飲食習慣", type: "textarea", required: true },
      {
        id: "storageHabit",
        label: "收納習慣",
        type: "choice",
        required: true,
        options: ["眼不見為淨，都往櫃子裡塞", "我會好好收拾"],
        other: true,
      },
      { id: "fengShui", label: "是否在意風水", type: "choice", options: ["是", "否"] },
      { id: "priority", label: "裝潢跟傢俱，哪個對您比較重要？", type: "choice", required: true, options: ["裝潢", "傢俱"] },
    ],
  },
  {
    title: "居住需求",
    description: "平常怎麼使用這個家，以及希望新家變成什麼樣子。",
    questions: [
      { id: "openness", label: "喜歡空間開放一些，還是隱蔽一些？", type: "choice", required: true, options: ["開放", "隱蔽"], other: true },
      {
        id: "mostUsedRoom",
        label: "平常在家最常待的地方",
        type: "choice",
        required: true,
        options: ["客廳", "餐廳", "臥室", "書房", "廁所"],
        other: true,
      },
      {
        id: "guestFrequency",
        label: "平常常有客人來家裡嗎？",
        type: "choice",
        required: true,
        options: ["每天", "每週 3 天", "每週 1 天", "每兩週 1 天", "每月 1 天", "每季", NO_GUESTS],
        other: true,
      },
      { id: "guestCount", label: "如果有客人，大概一次多少人？", type: "text", required: true },
      { id: "diningPlace", label: "平常都在哪裡吃飯？", type: "choice", required: true, options: ["客廳", "餐廳", "廚房"], other: true },
      {
        id: "cookingFrequency",
        label: "常下廚嗎？頻率如何？",
        type: "choice",
        required: true,
        options: ["每天", "每週 3 天以上", "每週 1 天", "每月 1 天"],
        other: true,
      },
      { id: "pets", label: "有養寵物嗎？", type: "choice", required: true, options: ["沒有", "貓", "狗"], other: true },
      { id: "specialStorage", label: "是否有特殊收納需求？", type: "textarea" },
      { id: "problems", label: "目前生活上需要被解決的問題", type: "textarea", required: true },
      { id: "wishlist", label: "希望在新家實現的空間", type: "textarea", required: true, placeholder: "例如 一定要吧台、更衣室" },
      { id: "oldFurniture", label: "會從舊家帶來的大型傢俱有哪些？", type: "textarea" },
    ],
  },
];

export const allQuestions = questionnaireSections.flatMap((s) => s.questions);

/** 選「其他」時，手動填寫的內容放在 `<題目 id>Other` 這個欄位 */
export const otherKey = (id: string) => `${id}Other`;

/** 參考圖：最多幾張、放在哪個 Storage bucket（不公開，只有後台看得到） */
export const MAX_REFERENCE_IMAGES = 5;
export const INQUIRY_UPLOADS_BUCKET = "inquiry-uploads";

export type QuestionnaireValues = Record<string, string>;
export type QuestionnaireErrors = Record<string, string>;

const MAX_LEN = { text: 200, textarea: 2000 } as const;

/** 這一題在目前的答案下是否必填（「不要有客人來」就不用回答一次來幾個人） */
export function isRequired(q: Question, values: QuestionnaireValues) {
  if (q.id === "guestCount" && values.guestFrequency === NO_GUESTS) return false;
  return !!q.required;
}

/**
 * 檢查答案並整理成要存的樣子（題目 id → 文字）。瀏覽器端和伺服器端都用這一個，真正把關的是伺服器端。
 * 單選選「其他」會存成「其他：手動填寫的內容」。
 */
export function validateQuestionnaire(
  values: QuestionnaireValues,
  questions: Question[] = allQuestions,
): { ok: true; answers: Record<string, string> } | { ok: false; errors: QuestionnaireErrors } {
  const errors: QuestionnaireErrors = {};
  const answers: Record<string, string> = {};

  for (const q of questions) {
    const raw = String(values[q.id] ?? "").trim();
    const required = isRequired(q, values);

    if (!raw) {
      if (required) errors[q.id] = q.type === "choice" || q.type === "scale" ? "請選擇一個選項" : "請填寫這一題";
      continue;
    }

    if (q.type === "text" || q.type === "textarea") {
      const max = MAX_LEN[q.type];
      if (raw.length > max) errors[q.id] = `最多 ${max} 個字`;
      else answers[q.id] = raw;
    } else if (q.type === "scale") {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < q.min || n > q.max) errors[q.id] = "請選擇一個選項";
      else answers[q.id] = String(n);
    } else if (q.type === "choice") {
      if (q.other && raw === OTHER) {
        const other = String(values[otherKey(q.id)] ?? "").trim();
        if (!other) errors[otherKey(q.id)] = "請填寫內容";
        else if (other.length > MAX_LEN.text) errors[otherKey(q.id)] = `最多 ${MAX_LEN.text} 個字`;
        else answers[q.id] = `${OTHER}：${other}`;
      } else if (q.options.includes(raw)) {
        answers[q.id] = raw;
      } else {
        errors[q.id] = "請選擇一個選項";
      }
    }
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, answers };
}

/** 把存起來的答案轉成「題目 → 答案」清單，給後台與通知信顯示。量表會補上滿分是多少。 */
export function questionnaireRows(answers: unknown): [string, string][] {
  if (!answers || typeof answers !== "object") return [];
  const a = answers as Record<string, unknown>;
  return allQuestions.flatMap((q): [string, string][] => {
    const v = a[q.id];
    if (typeof v !== "string" || !v) return [];
    return [[q.label, q.type === "scale" ? `${v} / ${q.max}（${q.min} ${q.minLabel}，${q.max} ${q.maxLabel}）` : v]];
  });
}
