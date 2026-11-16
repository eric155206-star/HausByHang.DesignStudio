"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { removeSiteImage, saveSiteImageAlt, setSiteImage } from "@/app/admin/(dashboard)/site-images/actions";
import { Button } from "@/components/ui/Button";
import { cropImage, loadImage, ORIGINAL_MAX_EDGE, resizeImage, type PixelArea } from "@/lib/admin/resize";
import { cn } from "@/lib/cn";
import type { SiteImageSlot } from "@/lib/site-images";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PROJECT_IMAGES_BUCKET, publicImageUrl } from "@/lib/supabase/config";
import { CropDialog } from "./CropDialog";
import { adminInput } from "./styles";

/** 裁切視窗要用的來源圖：新選的檔案（還沒上傳）或已經在 Storage 的原圖。 */
type CropSource = { url: string; blob: Blob | null; path: string | null };

/** 一個圖片位置：預覽、上傳／更換（先裁切）、重新裁切、說明文字、移除。動作都立即生效。 */
export function SiteImageCard({
  slot,
  image,
}: {
  slot: SiteImageSlot;
  image: { url: string; alt: string; originalPath: string } | null;
}) {
  const router = useRouter();
  const [alt, setAlt] = useState(image?.alt ?? "");
  const [status, setStatus] = useState<{ error?: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = pending || uploading;

  const [source, setSource] = useState<CropSource | null>(null);

  function fail(e: unknown, fallback: string) {
    setStatus({ error: true, text: e instanceof Error ? e.message : fallback });
  }

  function closeCrop() {
    if (source) URL.revokeObjectURL(source.url);
    setSource(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  /** 選好檔案：先縮圖，再開裁切視窗。這時還沒上傳任何東西。 */
  async function pick(file: File) {
    setStatus(null);
    setUploading(true);
    try {
      const { blob } = await resizeImage(file, { maxEdge: ORIGINAL_MAX_EDGE, quality: 0.95 });
      setSource({ url: URL.createObjectURL(blob), blob, path: null });
    } catch (e) {
      fail(e, "照片讀取失敗");
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  /** 重新裁切：把 Storage 裡的原圖抓回來當來源，不用重新選檔案。 */
  async function recrop() {
    if (!image) return;
    setStatus(null);
    setUploading(true);
    try {
      const res = await fetch(publicImageUrl(image.originalPath));
      if (!res.ok) throw new Error("原圖讀取失敗，請改用「更換照片」重新上傳");
      setSource({ url: URL.createObjectURL(await res.blob()), blob: null, path: image.originalPath });
    } catch (e) {
      fail(e, "原圖讀取失敗");
    } finally {
      setUploading(false);
    }
  }

  /** 裁切視窗按下確定：照框的範圍裁圖、上傳、寫進資料庫。 */
  async function save(areas: Record<"desktop" | "mobile", PixelArea | undefined>) {
    if (!source || !areas.desktop) return;
    const current = source;
    setSource(null);
    setUploading(true);
    try {
      const img = await loadImage(current.url);
      const storage = createSupabaseBrowserClient().storage.from(PROJECT_IMAGES_BUCKET);
      const id = crypto.randomUUID();
      const put = async (name: string, blob: Blob) => {
        const path = `site/${slot.slot}/${id}-${name}.jpg`;
        const { error } = await storage.upload(path, blob, {
          contentType: "image/jpeg",
          cacheControl: "31536000",
          upsert: false,
        });
        if (error) throw new Error(`上傳失敗：${error.message}`);
        return path;
      };

      const original = current.path ?? (await put("original", current.blob!));
      const desktop = await cropImage(img, areas.desktop);
      const desktopPath = await put("desktop", desktop.blob);
      let mobile: { path: string; width: number; height: number } | undefined;
      if (areas.mobile) {
        const m = await cropImage(img, areas.mobile);
        mobile = { path: await put("mobile", m.blob), width: m.width, height: m.height };
      }

      const result = await setSiteImage(slot.slot, {
        original,
        desktop: { path: desktopPath, width: desktop.width, height: desktop.height },
        mobile,
        alt: alt || slot.label,
      });
      if (!result.ok) throw new Error(result.error);
      if (!alt) setAlt(slot.label);
      setStatus({ text: current.path ? "已重新裁切，網站已更新" : image ? "已更換，網站已更新" : "已上傳，網站已更新" });
      router.refresh();
    } catch (e) {
      fail(e, "上傳失敗");
    } finally {
      URL.revokeObjectURL(current.url);
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
          <Image src={image.url} alt={image.alt} fill quality={90} sizes="(min-width: 1024px) 1100px, 100vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-4">尚未設定</div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={image ? "secondary" : "primary"} disabled={busy} onClick={() => inputRef.current?.click()}>
          {uploading ? "處理中…" : image ? "更換照片" : "上傳照片"}
        </Button>
        {image && (
          <Button size="sm" variant="secondary" disabled={busy} onClick={recrop}>
            重新裁切
          </Button>
        )}
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
          onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
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

      {source && (
        <CropDialog src={source.url} title={slot.label} crops={slot.crops} onCancel={closeCrop} onConfirm={save} />
      )}

      {status && (
        <p role="status" className={status.error ? "text-sm text-error" : "text-sm text-ink-2"}>
          {status.text}
        </p>
      )}
    </section>
  );
}
