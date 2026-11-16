"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  addImages,
  deleteImage,
  saveImages,
  setCover,
  type ActionResult,
} from "@/app/admin/(dashboard)/projects/actions";
import { Button } from "@/components/ui/Button";
import { resizeImage } from "@/lib/admin/resize";
import { cn } from "@/lib/cn";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PROJECT_IMAGES_BUCKET } from "@/lib/supabase/config";
import { adminInput } from "./styles";

export type AdminImage = {
  id: string;
  path: string;
  url: string;
  width: number;
  height: number;
  alt: string;
};

/**
 * 作品照片管理：上傳（自動縮圖）、排序、替代文字、設為封面、刪除。
 * 排序與替代文字改完要按「儲存照片順序與說明」；上傳、封面、刪除會立即生效。
 */
export function ImageManager({
  projectId,
  projectTitle,
  images,
  coverPath,
}: {
  projectId: string;
  projectTitle: string;
  images: AdminImage[];
  coverPath: string | null;
}) {
  const router = useRouter();
  const [list, setList] = useState(images);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ error?: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = pending || uploading !== null;

  function run(task: () => Promise<ActionResult>, success: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await task();
      if (result.ok) {
        setMessage({ text: success });
        setDirty(false);
        router.refresh();
      } else {
        setMessage({ error: true, text: result.error });
      }
    });
  }

  async function upload(files: FileList | File[]) {
    const picked = [...files].filter((f) => f.type.startsWith("image/"));
    if (!picked.length) return;
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const uploaded: { path: string; width: number; height: number; alt: string }[] = [];

    try {
      for (const [n, file] of picked.entries()) {
        setUploading(`處理中 ${n + 1} / ${picked.length}：${file.name}`);
        const { blob, width, height } = await resizeImage(file);
        const path = `${projectId}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage
          .from(PROJECT_IMAGES_BUCKET)
          .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
        if (error) throw new Error(`${file.name} 上傳失敗：${error.message}`);
        uploaded.push({ path, width, height, alt: projectTitle });
      }
    } catch (e) {
      setMessage({ error: true, text: e instanceof Error ? e.message : "上傳失敗" });
    }

    if (uploaded.length) {
      setUploading("存檔中…");
      const result = await addImages(projectId, uploaded);
      setMessage(
        result.ok ? { text: `已上傳 ${uploaded.length} 張照片` } : { error: true, text: result.error },
      );
      router.refresh();
    }
    setUploading(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function move(index: number, delta: number) {
    const next = [...list];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setList(next);
    setDirty(true);
  }

  function editAlt(index: number, alt: string) {
    setList(list.map((img, i) => (i === index ? { ...img, alt } : img)));
    setDirty(true);
  }

  return (
    <section className="flex flex-col gap-5 border border-line-strong bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg">照片（{list.length}）</h2>
        {dirty && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              run(
                () => saveImages(projectId, list.map((img, i) => ({ id: img.id, alt_text: img.alt, sort_order: i }))),
                "照片順序與說明已儲存",
              )
            }
          >
            儲存照片順序與說明
          </Button>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!busy) upload(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-3 border border-dashed px-6 py-8 text-center text-sm",
          dragOver ? "border-black bg-surface" : "border-line-strong",
        )}
      >
        <p className="text-ink-2">把照片拖到這裡，或</p>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
          選擇照片
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          hidden
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
        <p className="text-xs text-ink-3">可一次選多張。會自動縮到長邊 2400px，原始檔直接上傳即可。</p>
      </div>

      {(uploading || message) && (
        <p role="status" className={message?.error ? "text-sm text-error" : "text-sm text-ink-2"}>
          {uploading ?? message?.text}
        </p>
      )}

      {list.length > 0 && (
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((img, i) => {
            const isCover = img.path === coverPath;
            return (
              <li key={img.id} className="flex flex-col gap-2 border border-surface-hover p-2">
                <div className="relative aspect-[4/3] bg-surface">
                  <Image src={img.url} alt={img.alt} fill sizes="320px" className="object-contain" />
                  <span className="absolute left-2 top-2 bg-white/90 px-1.5 text-xs text-ink-2">{i + 1}</span>
                  {isCover && <span className="absolute right-2 top-2 bg-black px-1.5 text-xs text-white">封面</span>}
                </div>
                <input
                  value={img.alt}
                  onChange={(e) => editAlt(i, e.target.value)}
                  placeholder="照片說明（替代文字）"
                  aria-label={`第 ${i + 1} 張照片說明`}
                  className={`${adminInput} text-[13px]`}
                />
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <SmallButton disabled={busy || i === 0} onClick={() => move(i, -1)} label="往前" />
                  <SmallButton disabled={busy || i === list.length - 1} onClick={() => move(i, 1)} label="往後" />
                  {!isCover && (
                    <SmallButton
                      disabled={busy}
                      onClick={() => run(() => setCover(projectId, img.id), "已設為封面")}
                      label="設為封面"
                    />
                  )}
                  <SmallButton
                    disabled={busy}
                    danger
                    onClick={() => {
                      if (confirm("確定刪除這張照片？刪除後無法復原。")) {
                        run(() => deleteImage(projectId, img.id), "照片已刪除");
                      }
                    }}
                    label="刪除"
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p className="text-xs text-ink-3">
        第 1 張橫式照片會當作品內頁的主圖；封面用在作品卡片，會裁成 4:5 直式，建議選直式照片。
      </p>
    </section>
  );
}

function SmallButton({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-[4px] border px-2 py-1 transition-colors disabled:opacity-40",
        danger ? "border-error text-error hover:bg-error hover:text-white" : "border-line-strong text-ink hover:border-black",
      )}
    >
      {label}
    </button>
  );
}
