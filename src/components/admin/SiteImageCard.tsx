"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { removeSiteImage, saveSiteImageAlt, setSiteImage } from "@/app/admin/(dashboard)/site-images/actions";
import { Button } from "@/components/ui/Button";
import { resizeImage } from "@/lib/admin/resize";
import { cn } from "@/lib/cn";
import type { SiteImageSlot } from "@/lib/site-images";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PROJECT_IMAGES_BUCKET } from "@/lib/supabase/config";
import { adminInput } from "./styles";

/** 一個圖片位置：預覽、上傳／更換、說明文字、移除。動作都立即生效。 */
export function SiteImageCard({
  slot,
  image,
}: {
  slot: SiteImageSlot;
  image: { url: string; alt: string } | null;
}) {
  const router = useRouter();
  const [alt, setAlt] = useState(image?.alt ?? "");
  const [status, setStatus] = useState<{ error?: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = pending || uploading;

  async function upload(file: File) {
    setStatus(null);
    setUploading(true);
    try {
      const { blob, width, height } = await resizeImage(file);
      const path = `site/${slot.slot}/${crypto.randomUUID()}.jpg`;
      const { error } = await createSupabaseBrowserClient()
        .storage.from(PROJECT_IMAGES_BUCKET)
        .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
      if (error) throw new Error(`上傳失敗：${error.message}`);
      const result = await setSiteImage(slot.slot, { path, width, height, alt: alt || slot.label });
      if (!result.ok) throw new Error(result.error);
      if (!alt) setAlt(slot.label);
      setStatus({ text: image ? "已更換，網站已更新" : "已上傳，網站已更新" });
      router.refresh();
    } catch (e) {
      setStatus({ error: true, text: e instanceof Error ? e.message : "上傳失敗" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function run(task: () => ReturnType<typeof saveSiteImageAlt>, success: string) {
    setStatus(null);
    startTransition(async () => {
      const result = await task();
      setStatus(result.ok ? { text: success } : { error: true, text: result.error });
      if (result.ok) router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4 border border-line-strong bg-white p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg">{slot.label}</h2>
        <p className="text-xs leading-[1.7] text-ink-3">{slot.hint}</p>
      </div>

      <div className={cn("relative overflow-hidden bg-surface", slot.aspect)}>
        {image ? (
          <Image src={image.url} alt={image.alt} fill sizes="600px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-4">尚未設定</div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={image ? "secondary" : "primary"} disabled={busy} onClick={() => inputRef.current?.click()}>
          {uploading ? "上傳中…" : image ? "更換照片" : "上傳照片"}
        </Button>
        {image && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (confirm(`確定移除「${slot.label}」的照片？`)) run(() => removeSiteImage(slot.slot), "已移除");
            }}
            className="rounded-[4px] border border-error px-2 py-1 text-xs text-error transition-colors hover:bg-error hover:text-white disabled:opacity-40"
          >
            移除
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          hidden
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>

      {image && (
        <div className="flex gap-2">
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="照片說明（替代文字）"
            aria-label={`${slot.label}照片說明`}
            className={`${adminInput} text-[13px]`}
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || alt === image.alt}
            onClick={() => run(() => saveSiteImageAlt(slot.slot, alt), "說明已儲存")}
          >
            儲存
          </Button>
        </div>
      )}

      {status && (
        <p role="status" className={status.error ? "text-sm text-error" : "text-sm text-ink-2"}>
          {status.text}
        </p>
      )}
    </section>
  );
}
