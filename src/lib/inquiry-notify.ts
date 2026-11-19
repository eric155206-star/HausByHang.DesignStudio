import "server-only";
import type { Inquiry } from "@/lib/inquiry";
import { site } from "@/lib/site";

/**
 * 新詢問的通知信，透過 Resend 寄到公司信箱。
 * 直接呼叫 Resend 的 API，不另外裝套件。金鑰放在環境變數 RESEND_API_KEY，只在伺服器端使用。
 */
export const mailConfigured = Boolean(process.env.RESEND_API_KEY);

const FROM = `沆設計 haus by hang. <no-reply@hausbyhang.com>`;

/** 訪客填的內容會放進信件 HTML，先把 < > & " 換掉，避免被當成 HTML 標籤執行。 */
function esc(v: string) {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function inquiryRows(q: Inquiry): [string, string][] {
  const rows: [string, string | null][] = [
    ["姓名", q.name],
    ["電話", q.phone],
    ["LINE ID", q.lineId],
    ["Email", q.email],
    ["空間類型", q.spaceType],
    ["房屋現況", q.houseCondition],
    ["房屋類型", q.houseType],
    ["屋齡", q.houseAge === null ? null : `${q.houseAge} 年`],
    ["地區", q.region],
    ["坪數", q.area === null ? null : `${q.area} 坪`],
    ["預算", q.budget],
    ["需求說明", q.message],
  ];
  return rows.filter((r): r is [string, string] => !!r[1]);
}

/** 寄通知信。成功回傳 true；失敗只記錄、回傳 false，不讓訪客的送出跟著失敗。 */
export async function sendInquiryNotification(id: string, q: Inquiry): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  const rows = inquiryRows(q);
  const link = `${site.url}/admin/inquiries/${id}`;
  const html = `<div style="font-family:sans-serif;font-size:15px;line-height:1.7;color:#291d11">
<p>官網收到一筆新的預約諮詢：</p>
<table style="border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#7e6e60;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;white-space:pre-wrap">${esc(v)}</td></tr>`,
    )
    .join("")}</table>
<p><a href="${link}" style="color:#354966">在後台查看這筆詢問</a></p>
${q.email ? "<p style=\"color:#7e6e60;font-size:13px\">直接回覆這封信，就會寄給客戶。</p>" : ""}
</div>`;
  const text = `官網收到一筆新的預約諮詢：\n\n${rows.map(([k, v]) => `${k}：${v}`).join("\n")}\n\n後台：${link}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [process.env.INQUIRY_NOTIFY_EMAIL || site.email],
        reply_to: q.email ?? undefined,
        subject: `新詢問：${q.name}（${q.spaceType}・${q.region}）`,
        html,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[inquiry] 通知信寄送失敗", res.status, (await res.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[inquiry] 通知信寄送失敗", e instanceof Error ? e.message : e);
    return false;
  }
}
