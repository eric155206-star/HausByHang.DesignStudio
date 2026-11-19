import { z } from "zod";

/**
 * /contact 預約諮詢表單：選項與驗證規則。
 * 瀏覽器端與伺服器端共用；真正把關的是伺服器端（Server Action）。
 */

export const spaceTypes = ["住宅", "商業空間"] as const;
export const houseConditions = ["新成屋", "毛胚屋", "老屋", "預售屋"] as const;
/** 商業空間沒有預售屋 */
export const commercialHouseConditions = ["新成屋", "毛胚屋", "老屋"] as const;
/** 依空間類型決定「房屋現況」有哪些選項 */
export const houseConditionsFor = (spaceType: string): readonly string[] =>
  spaceType === "商業空間" ? commercialHouseConditions : houseConditions;
/** 商業空間才需要選的營業類型；選「其他」時另外手動填寫 */
export const businessTypes = ["餐廳", "零售", "百貨櫃位", "辦公空間", "其他"] as const;
export const houseTypes = ["公寓", "華廈", "電梯大樓", "透天厝", "店面", "辦公室", "其他"] as const;
/** 住宅只列住宅會有的類型；商業空間才有店面、辦公室、其他 */
export const residentialHouseTypes = ["公寓", "華廈", "電梯大樓", "透天厝"] as const;
export const houseTypesFor = (spaceType: string): readonly string[] =>
  spaceType === "住宅" ? residentialHouseTypes : houseTypes;
/** 預算從 150 萬起，級距每 100 萬一級（使用者 2026-11-19 指定） */
export const budgets = ["150–250 萬", "250–350 萬", "350–450 萬", "450 萬以上"] as const;

/** 服務範圍只有雙北與桃園（使用者 2026-11-19 指定） */
export const regions = ["台北市", "新北市", "桃園市"] as const;

/** 去掉空白、橫線、括號後，接受台灣手機（09 開頭 10 碼）與市話（區碼＋7–8 碼），可用 +886 開頭。 */
const TW_PHONE = /^(?:\+?886|0)(?:9\d{8}|[2-8]\d{7,8})$/;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `最多 ${max} 個字`)
    .transform((v) => v || null);

const optionalNumber = (label: string, max: number) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (!v) return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || n > max) {
        ctx.addIssue({ code: "custom", message: `${label}請填 0–${max} 的數字` });
        return z.NEVER;
      }
      return n;
    });

const choice = <T extends readonly [string, ...string[]]>(options: T, message: string) =>
  z.enum(options, { error: message });

export const inquirySchema = z
  .object({
  name: z.string().trim().min(1, "請填寫姓名").max(50, "姓名最多 50 個字"),
  phone: z
    .string()
    .trim()
    .min(1, "請填寫聯絡電話")
    .transform((v) => v.replace(/[\s\-()]/g, ""))
    .refine((v) => TW_PHONE.test(v), "電話格式不正確，例如 0912345678 或 02-23456789"),
  lineId: optionalText(50),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => !v || z.email().safeParse(v).success, "Email 格式不正確")
    .transform((v) => v || null),
  spaceType: choice(spaceTypes, "請選擇空間類型"),
  businessType: z.union([z.literal(""), z.enum(businessTypes)], { error: "營業類型選項不正確" }),
  businessTypeOther: z.string().trim().max(50, "最多 50 個字"),
  houseCondition: choice(houseConditions, "請選擇房屋現況"),
  houseType: z
    .union([z.literal(""), z.enum(houseTypes)], { error: "房屋類型選項不正確" })
    .transform((v) => v || null),
  houseAge: optionalNumber("屋齡", 150),
  region: choice(regions, "請選擇地區"),
  area: optionalNumber("坪數", 2000),
  budget: choice(budgets, "請選擇預算區間"),
  message: optionalText(2000),
  consent: z.literal("on", { error: "請勾選同意個人資料告知事項" }),
  })
  .superRefine((q, ctx) => {
    if (q.houseType && !houseTypesFor(q.spaceType).includes(q.houseType)) {
      ctx.addIssue({ code: "custom", path: ["houseType"], message: "房屋類型選項不正確" });
    }
    if (q.spaceType !== "商業空間") return;
    if (!q.businessType) {
      ctx.addIssue({ code: "custom", path: ["businessType"], message: "請選擇營業類型" });
    } else if (q.businessType === "其他" && !q.businessTypeOther) {
      ctx.addIssue({ code: "custom", path: ["businessTypeOther"], message: "請填寫營業類型" });
    }
    if (q.houseCondition === "預售屋") {
      ctx.addIssue({ code: "custom", path: ["houseCondition"], message: "請選擇房屋現況" });
    }
  })
  // 營業類型整理成一個值：住宅沒有；選「其他」就存手動填的內容
  .transform(({ businessTypeOther, ...q }) => ({
    ...q,
    businessType:
      q.spaceType !== "商業空間"
        ? null
        : q.businessType === "其他"
          ? `其他：${businessTypeOther}`
          : q.businessType || null,
  }));

export type Inquiry = z.output<typeof inquirySchema>;
export type InquiryField = keyof z.input<typeof inquirySchema>;

export type InquiryState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<InquiryField, string>>;
      /** 送出失敗時把使用者填的內容帶回去，不用重填 */
      values?: Partial<Record<InquiryField, string>>;
    };
