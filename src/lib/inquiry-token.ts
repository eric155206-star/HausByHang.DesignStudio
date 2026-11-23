import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * 詳細問卷用的通行碼：基本資料存檔後，伺服器把「這筆詢問單的 id」蓋上只有伺服器知道的印章交給瀏覽器，
 * 之後送問卷、上傳參考圖都要帶著它。沒有印章就算猜到 id，也改不了別人的詢問單。
 */
const secret = () => process.env.IP_HASH_SALT || process.env.SUPABASE_SECRET_KEY || "";

export function inquiryToken(id: string) {
  return createHmac("sha256", secret()).update(`questionnaire:${id}`).digest("hex");
}

export function verifyInquiryToken(id: string, token: string) {
  if (!secret() || !/^[0-9a-f]{64}$/.test(token)) return false;
  return timingSafeEqual(Buffer.from(inquiryToken(id), "hex"), Buffer.from(token, "hex"));
}
