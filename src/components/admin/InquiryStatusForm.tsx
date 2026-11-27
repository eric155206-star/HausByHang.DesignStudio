"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteInquiry, updateInquiry } from "@/app/admin/(dashboard)/inquiries/actions";
import { Button } from "@/components/ui/Button";
import { inquiryStatuses, type InquiryStatus } from "@/lib/inquiry-status";
import { adminInput } from "./styles";

/** 詢問單的處理狀態、內部備註與刪除。備註只有後台看得到，客戶不會看到。 */
export function InquiryStatusForm({
  id,
  name,
  status: initialStatus,
  note: initialNote,
}: {
  id: string;
  name: string;
  status: InquiryStatus;
  note: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState(initialNote);
  const [message, setMessage] = useState<{ error?: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <section className="flex flex-col gap-5 border border-line-strong bg-white p-6">
      <label className="flex flex-col gap-2 text-sm">
        處理狀態
        <select value={status} onChange={(e) => setStatus(e.target.value as InquiryStatus)} className={adminInput}>
          {inquiryStatuses.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm">
        內部備註
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={6}
          className={adminInput}
          placeholder="例如：11/20 已電話聯絡，約 11/25 現場丈量"
        />
        <span className="text-xs text-ink-3">只有後台看得到，客戶不會看到。</span>
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <Button
          disabled={pending}
          onClick={() => {
            setMessage(null);
            start(async () => {
              const result = await updateInquiry(id, { status, note });
              setMessage(result.ok ? { text: "已儲存" } : { error: true, text: result.error });
              if (result.ok) router.refresh();
            });
          }}
        >
          {pending ? "儲存中…" : "儲存"}
        </Button>
        {message && (
          <p role="status" className={message.error ? "text-sm text-error" : "text-sm text-ink-2"}>
            {message.text}
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`確定刪除「${name}」的詢問單？刪除後無法復原。`)) return;
          start(async () => {
            const result = await deleteInquiry(id);
            if (result && !result.ok) setMessage({ error: true, text: result.error });
          });
        }}
        className="self-start text-sm text-error hover:underline disabled:opacity-40"
      >
        刪除這筆詢問
      </button>
    </section>
  );
}
