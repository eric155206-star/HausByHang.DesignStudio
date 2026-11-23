import "server-only";
import type { Inquiry } from "@/lib/inquiry";
import { questionnaireRows } from "@/lib/questionnaire";
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
    ["營業類型", q.businessType],
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

type Mail = { id: string; subject: string; intro: string; rows: [string, string][]; replyTo: string | null };

/** 實際寄信。成功回傳 true；失敗只記錄、回傳 false，不讓訪客的送出跟著失敗。 */
async function send({ id, subject, intro, rows, replyTo }: Mail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  const link = `${site.url}/admin/inquiries/${id}`;
  const html = `<div style="font-family:sans-serif;font-size:15px;line-height:1.7;color:#291d11">
<p>${esc(intro)}</p>
<table style="border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#7e6e60;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;white-space:pre-wrap">${esc(v)}</td></tr>`,
    )
    .join("")}</table>
<p><a href="${link}" style="color:#354966">在後台查看這筆詢問</a></p>
${replyTo ? "<p style=\"color:#7e6e60;font-size:13px\">直接回覆這封信，就會寄給客戶。</p>" : ""}
</div>`;
  const text = `${intro}\n\n${rows.map(([k, v]) => `${k}：${v}`).join("\n")}\n\n後台：${link}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [process.env.INQUIRY_NOTIFY_EMAIL || site.email],
        reply_to: replyTo ?? undefined,
        subject,
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

/** 新詢問（基本資料）的通知信 */
export function sendInquiryNotification(id: string, q: Inquiry): Promise<boolean> {
  return send({
    id,
    subject: `新詢問：${q.name}（${q.spaceType}・${q.region}）`,
    intro: "官網收到一筆新的預約諮詢：",
    rows: inquiryRows(q),
    replyTo: q.email,
  });
}

/** 客人接著填完詳細問卷的通知信 */
export function sendQuestionnaireNotification(
  id: string,
  who: { name: string; email: string | null },
  answers: Record<string, string>,
  imageCount: number,
): Promise<boolean> {
  const rows = questionnaireRows(answers);
  if (imageCount) rows.push(["參考圖", `${imageCount} 張（請到後台查看）`]);
  return send({
    id,
    subject: `問卷已填寫：${who.name}`,
    intro: `${who.name} 填完了詳細問卷：`,
    rows,
    replyTo: who.email,
  });
}
