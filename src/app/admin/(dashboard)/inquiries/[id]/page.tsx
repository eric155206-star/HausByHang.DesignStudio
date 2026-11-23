import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InquiryStatusForm } from "@/components/admin/InquiryStatusForm";
import { requireAdmin } from "@/lib/admin/auth";
import { formatTaipei, isInquiryStatus } from "@/lib/inquiry-status";
import { INQUIRY_UPLOADS_BUCKET, questionnaireRows } from "@/lib/questionnaire";
import { adminKeyConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "詢問單內容" };

export default async function InquiryPage({ params }: PageProps<"/admin/inquiries/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const { supabase } = await requireAdmin();
  const { data: q } = await supabase
    .from("inquiries")
    .select(
      "id, name, phone, line_id, email, space_type, business_type, house_condition, house_type, house_age, region, area_ping, budget, message, status, admin_note, notified_at, created_at, questionnaire, reference_images, questionnaire_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!q) notFound();

  const answers = questionnaireRows(q.questionnaire);
  // 參考圖放在不公開的空間，這裡產生一小時內有效的連結給後台看
  const paths: string[] = q.reference_images ?? [];
  let images: string[] = [];
  if (paths.length && adminKeyConfigured) {
    const { data } = await createSupabaseAdminClient()
      .storage.from(INQUIRY_UPLOADS_BUCKET)
      .createSignedUrls(paths, 60 * 60);
    images = (data ?? []).flatMap((d) => (d.signedUrl ? [d.signedUrl] : []));
  }

  const rows: { k: string; v: string | null; href?: string }[] = [
    { k: "電話", v: q.phone, href: `tel:${q.phone}` },
    { k: "LINE ID", v: q.line_id },
    { k: "Email", v: q.email, href: q.email ? `mailto:${q.email}` : undefined },
    { k: "空間類型", v: q.space_type },
    { k: "營業類型", v: q.business_type },
    { k: "房屋現況", v: q.house_condition },
    { k: "房屋類型", v: q.house_type },
    { k: "屋齡", v: q.house_age === null ? null : `${q.house_age} 年` },
    { k: "地區", v: q.region },
    { k: "坪數", v: q.area_ping === null ? null : `${q.area_ping} 坪` },
    { k: "預算", v: q.budget },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/inquiries" className="text-sm text-link hover:underline">
        ← 詢問單列表
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl">{q.name}</h1>
        <p className="text-sm text-ink-3">
          {formatTaipei(q.created_at)} 送出
          {q.notified_at ? "，通知信已寄出" : "，通知信未寄出（可能還在寄送，或寄送失敗）"}
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <section className="flex flex-col gap-5 border border-line-strong bg-white p-6">
          <dl className="border-t border-surface-hover">
            {rows.map((r) => (
              <div key={r.k} className="flex justify-between gap-6 border-b border-surface-hover py-[11px] text-sm">
                <dt className="shrink-0 text-ink-3">{r.k}</dt>
                <dd className="text-right text-black">
                  {r.v ? (
                    r.href ? (
                      <a href={r.href} className="text-link hover:underline">
                        {r.v}
                      </a>
                    ) : (
                      r.v
                    )
                  ) : (
                    <span className="text-ink-4">未填</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-2">
            <h2 className="text-sm text-ink-3">需求說明</h2>
            <p className="whitespace-pre-wrap text-[15px] leading-[1.9] text-black">
              {q.message || <span className="text-ink-4">未填</span>}
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-line-strong pt-5">
            <h2 className="text-sm text-ink-3">
              詳細問卷{q.questionnaire_at && `（${formatTaipei(q.questionnaire_at)} 填寫）`}
            </h2>
            {answers.length === 0 ? (
              <p className="text-sm text-ink-4">
                {q.space_type === "住宅" ? "客人沒有填寫問卷。" : "商業空間不需要填寫問卷。"}
              </p>
            ) : (
              <dl className="flex flex-col gap-4">
                {answers.map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1">
                    <dt className="text-xs text-ink-3">{k}</dt>
                    <dd className="whitespace-pre-wrap text-[15px] leading-[1.8] text-black">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            {paths.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-xs text-ink-3">參考圖（點圖看大圖，連結一小時內有效）</h3>
                {images.length ? (
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {images.map((src, n) => (
                      <li key={src} className="aspect-square overflow-hidden bg-warm-gray">
                        <a href={src} target="_blank" rel="noreferrer">
                          {/* 限時連結每次不同，不適合經過 next/image 快取 */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`參考圖 ${n + 1}`} loading="lazy" className="h-full w-full object-cover" />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-error">參考圖暫時讀不到，請重新整理再試。</p>
                )}
              </div>
            )}
          </div>
        </section>

        <InquiryStatusForm
          id={q.id}
          name={q.name}
          status={isInquiryStatus(q.status) ? q.status : "new"}
          note={q.admin_note ?? ""}
        />
      </div>
    </div>
  );
}
