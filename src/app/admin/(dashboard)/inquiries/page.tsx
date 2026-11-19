import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { cn } from "@/lib/cn";
import { formatTaipei, inquiryStatuses, inquiryStatusLabel, isInquiryStatus, type InquiryStatus } from "@/lib/inquiry-status";

export const metadata: Metadata = { title: "詢問單" };

export default async function AdminInquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  const { status: rawStatus } = await searchParams;
  const filter = isInquiryStatus(rawStatus) ? rawStatus : null;

  const { supabase } = await requireAdmin();
  let query = supabase
    .from("inquiries")
    .select("id, name, phone, space_type, region, budget, status, notified_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter) query = query.eq("status", filter);
  const { data: inquiries, error } = await query;

  const tabs: { key: InquiryStatus | null; label: string }[] = [{ key: null, label: "全部" }, ...inquiryStatuses];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl">詢問單</h1>
        <p className="text-sm text-ink-3">客戶在「預約諮詢」頁送出的資料，新的在最上面。每筆新詢問也會寄通知信到公司信箱。</p>
      </div>

      <nav className="flex gap-1 border-b border-line-strong" aria-label="處理狀態">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={t.key ? `/admin/inquiries?status=${t.key}` : "/admin/inquiries"}
            aria-current={t.key === filter ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm",
              t.key === filter ? "border-black text-black" : "border-transparent text-ink-3 hover:text-black",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {error && <p className="text-sm text-error">讀取失敗：{error.message}（如果是剛更新，請確認詢問單的 SQL 已執行）</p>}

      {inquiries && inquiries.length === 0 && (
        <p className="bg-white px-6 py-12 text-center text-sm text-ink-3">
          {filter ? `沒有「${inquiryStatusLabel[filter]}」的詢問單。` : "還沒有收到詢問單。"}
        </p>
      )}

      {inquiries && inquiries.length > 0 && (
        <ul className="divide-y divide-surface-hover border border-line-strong bg-white">
          {inquiries.map((q) => (
            <li key={q.id}>
              <Link href={`/admin/inquiries/${q.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface">
                <span className={cn("min-w-0 flex-1 text-[15px] text-black", q.status === "new" && "font-semibold")}>{q.name}</span>
                <span className="text-xs text-ink-3">{[q.space_type, q.region, q.budget].join(" · ")}</span>
                <span className="text-xs text-ink-3 tabular-nums">{formatTaipei(q.created_at)}</span>
                {!q.notified_at && <span className="text-xs text-error">通知信未寄出</span>}
                <span className={q.status === "new" ? "text-xs text-black" : "text-xs text-ink-4"}>
                  {inquiryStatusLabel[q.status as InquiryStatus] ?? q.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
