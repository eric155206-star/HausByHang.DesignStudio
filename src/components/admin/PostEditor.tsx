"use client";

import { Image as TiptapImage } from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import {
  deletePost,
  removePostCover,
  savePost,
  setPostCover,
  type PostFormState,
} from "@/app/admin/(dashboard)/posts/actions";
import { Button } from "@/components/ui/Button";
import { cropImage, loadImage, ORIGINAL_MAX_EDGE, resizeImage, type PixelArea } from "@/lib/admin/resize";
import { cn } from "@/lib/cn";
import { safeHref, type PostDoc } from "@/lib/posts/content";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PROJECT_IMAGES_BUCKET, publicImageUrl } from "@/lib/supabase/config";
import { CropDialog } from "./CropDialog";
import { adminInput } from "./styles";

export type PostEditorValues = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverUrl: string | null;
  content: PostDoc;
  isPublished: boolean;
  publishedOn: string;
};

/** 圖片多記寬高，前台才能用 next/image 預留空間、不讓版面跳動。 */
const PostImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
      height: { default: null },
    };
  },
});

const COVER_CROP = [{ key: "desktop" as const, label: "3:2", ratio: 3 / 2 }];

async function uploadPostImage(postId: string, blob: Blob) {
  const path = `posts/${postId}/${crypto.randomUUID()}.jpg`;
  const { error } = await createSupabaseBrowserClient()
    .storage.from(PROJECT_IMAGES_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`上傳失敗：${error.message}`);
  return path;
}

/**
 * 文章編輯頁：基本欄位、封面、內文編輯器、儲存與刪除。
 * 封面的上傳、更換、移除立即生效；其他欄位和內文要按「儲存」。
 */
export function PostEditor({ post }: { post: PostEditorValues }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [publishedOn, setPublishedOn] = useState(post.publishedOn);
  const [isPublished, setIsPublished] = useState(post.isPublished);
  const [state, setState] = useState<PostFormState>({ status: "idle" });
  const [dirty, setDirty] = useState(false);
  const [saving, startSaving] = useTransition();
  const [imageBusy, setImageBusy] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      PostImage,
      Placeholder.configure({ placeholder: "從這裡開始寫…" }),
    ],
    content: post.content,
    // Next.js 會先在伺服器畫一次頁面，編輯器只能在瀏覽器裡啟動，所以關掉立即渲染避免兩邊畫面對不上
    immediatelyRender: false,
    editorProps: { attributes: { class: "post-body", "aria-label": "文章內文" } },
    onUpdate: () => setDirty(true),
  });

  // 有未儲存的修改時，關分頁或重新整理前先提醒
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const err = state.fieldErrors ?? {};
  const change = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setDirty(true);
  };

  function save() {
    if (!editor) return;
    startSaving(async () => {
      const result = await savePost(post.id, {
        title,
        slug,
        excerpt,
        published_on: publishedOn,
        is_published: isPublished,
        content: editor.getJSON(),
      });
      setState(result);
      if (result.status === "saved") {
        setDirty(false);
        router.refresh();
      }
    });
  }

  async function insertImage(file: File) {
    if (!editor) return;
    setImageBusy(true);
    setState({ status: "idle" });
    try {
      const { blob, width, height } = await resizeImage(file, { quality: 0.9 });
      const path = await uploadPostImage(post.id, blob);
      const alt = prompt("這張圖片的說明（給搜尋引擎和看不到圖的人，可留空）", "") ?? "";
      editor
        .chain()
        .focus()
        .insertContent({ type: "image", attrs: { src: publicImageUrl(path), alt: alt.trim(), width, height } })
        .run();
    } catch (e) {
      setState({ status: "error", message: e instanceof Error ? e.message : "圖片上傳失敗" });
    } finally {
      setImageBusy(false);
      if (imageInput.current) imageInput.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-2xl">{title || "未命名文章"}</h1>
        {post.isPublished && (
          <Link href={`/blog/${post.slug}`} target="_blank" className="text-sm text-link hover:underline">
            在網站上查看 ↗
          </Link>
        )}
      </div>

      <section className="flex flex-col gap-5 border border-line-strong bg-white p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="標題" error={err.title}>
            <input value={title} onChange={(e) => change(setTitle)(e.target.value)} className={adminInput} aria-invalid={err.title ? true : undefined} />
          </Field>
          <Field label="網址代碼" error={err.slug} hint="hausbyhang.com/blog/這裡">
            <input value={slug} onChange={(e) => change(setSlug)(e.target.value)} className={adminInput} aria-invalid={err.slug ? true : undefined} />
          </Field>
        </div>
        <Field label="摘要" error={err.excerpt} hint="文章列表與 Google 搜尋結果用，一兩句話，最多 200 字。">
          <textarea value={excerpt} onChange={(e) => change(setExcerpt)(e.target.value)} rows={2} className={adminInput} />
        </Field>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isPublished} onChange={(e) => change(setIsPublished)(e.target.checked)} className="size-4 accent-black" />
            發佈到網站
          </label>
          <label className="flex items-center gap-2 whitespace-nowrap">
            發佈日期
            <input
              type="date"
              value={publishedOn}
              onChange={(e) => change(setPublishedOn)(e.target.value)}
              className={`${adminInput} w-44`}
              aria-invalid={err.published_on ? true : undefined}
            />
            <span className="text-xs text-ink-3">留空的話，發佈時自動填今天</span>
          </label>
        </div>
      </section>

      <CoverField postId={post.id} coverUrl={post.coverUrl} title={title} />

      <section className="flex flex-col border border-line-strong bg-white">
        <Toolbar editor={editor} imageBusy={imageBusy} onPickImage={() => imageInput.current?.click()} />
        <div className="mx-auto w-full max-w-[720px] px-6 py-8">
          <EditorContent editor={editor} />
        </div>
        <input
          ref={imageInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          hidden
          onChange={(e) => e.target.files?.[0] && insertImage(e.target.files[0])}
        />
      </section>

      <div className="sticky bottom-0 -mx-2 flex flex-wrap items-center gap-4 border-t border-line-strong bg-surface px-2 py-3">
        <Button disabled={saving || !editor} onClick={save}>
          {saving ? "儲存中…" : "儲存"}
        </Button>
        {state.message ? (
          <p role="status" className={state.status === "error" ? "text-sm text-error" : "text-sm text-ink-2"}>
            {state.message}
          </p>
        ) : (
          dirty && <p className="text-sm text-ink-3">有尚未儲存的修改</p>
        )}
      </div>

      <DeletePostButton id={post.id} title={title} />
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      {label}
      {children}
      {hint && !error && <span className="text-xs text-ink-3">{hint}</span>}
      {error && <span className="text-[13px] text-error">{error}</span>}
    </label>
  );
}

// ─────────────── 工具列 ───────────────

function Toolbar({ editor, imageBusy, onPickImage }: { editor: Editor | null; imageBusy: boolean; onPickImage: () => void }) {
  // 游標移動時重新判斷哪些按鈕要亮起來
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            quote: e.isActive("blockquote"),
            link: e.isActive("link"),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });
  if (!editor || !active) return <div className="h-[49px] border-b border-line-strong" />;

  function setLink() {
    if (!editor) return;
    const current = (editor.getAttributes("link").href as string | undefined) ?? "";
    const input = prompt("連結網址（留空則移除連結）", current || "https://");
    if (input === null) return;
    const value = input.trim();
    if (!value || value === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const href = safeHref(value) ?? safeHref(`https://${value}`);
    if (!href) {
      alert("這個網址格式不能用，請貼完整網址，例如 https://example.com");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  const chain = () => editor.chain().focus();
  return (
    <div
      role="toolbar"
      aria-label="內文格式"
      className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-line-strong bg-white px-3 py-2"
    >
      <Tool label="大標題" on={active.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
      <Tool label="小標題" on={active.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()} />
      <Divider />
      <Tool label="粗體" on={active.bold} onClick={() => chain().toggleBold().run()} className="font-semibold" />
      <Tool label="斜體" on={active.italic} onClick={() => chain().toggleItalic().run()} className="italic" />
      <Tool label="底線" on={active.underline} onClick={() => chain().toggleUnderline().run()} className="underline" />
      <Divider />
      <Tool label="項目清單" on={active.bullet} onClick={() => chain().toggleBulletList().run()} />
      <Tool label="編號清單" on={active.ordered} onClick={() => chain().toggleOrderedList().run()} />
      <Tool label="引言" on={active.quote} onClick={() => chain().toggleBlockquote().run()} />
      <Divider />
      <Tool label="連結" on={active.link} onClick={setLink} />
      <Tool label={imageBusy ? "上傳中…" : "圖片"} disabled={imageBusy} onClick={onPickImage} />
      <Tool label="分隔線" onClick={() => chain().setHorizontalRule().run()} />
      <Divider />
      <Tool label="復原" disabled={!active.canUndo} onClick={() => chain().undo().run()} />
      <Tool label="重做" disabled={!active.canRedo} onClick={() => chain().redo().run()} />
    </div>
  );
}

function Tool({
  label,
  on,
  disabled,
  onClick,
  className,
}: {
  label: string;
  on?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      // 按工具列時不要讓編輯器失去選取範圍
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "rounded-[4px] px-2.5 py-1.5 text-[13px] leading-none transition-colors disabled:opacity-40",
        on ? "bg-black text-white" : "text-ink-2 hover:bg-surface-hover hover:text-black",
        className,
      )}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-line-strong" />;
}

// ─────────────── 封面 ───────────────

function CoverField({ postId, coverUrl: initialCover, title }: { postId: string; coverUrl: string | null; title: string }) {
  // 封面存在這個元件自己的狀態裡，更新後不重新整理頁面，才不會把上面還沒儲存的內文洗掉
  const [coverUrl, setCoverUrl] = useState(initialCover);
  const [source, setSource] = useState<{ url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ error?: boolean; text: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const fail = (e: unknown, fallback: string) => setStatus({ error: true, text: e instanceof Error ? e.message : fallback });
  const reset = () => {
    if (input.current) input.current.value = "";
  };

  async function pick(file: File) {
    setStatus(null);
    setBusy(true);
    try {
      const { blob } = await resizeImage(file, { maxEdge: ORIGINAL_MAX_EDGE, quality: 0.95 });
      setSource({ url: URL.createObjectURL(blob) });
    } catch (e) {
      fail(e, "照片讀取失敗");
      reset();
    } finally {
      setBusy(false);
    }
  }

  async function save(areas: Record<"desktop" | "mobile", PixelArea | undefined>) {
    if (!source || !areas.desktop) return;
    const current = source;
    setSource(null);
    setBusy(true);
    try {
      const cropped = await cropImage(await loadImage(current.url), areas.desktop);
      const path = await uploadPostImage(postId, cropped.blob);
      const result = await setPostCover(postId, { path, width: cropped.width, height: cropped.height });
      if (!result.ok) throw new Error(result.error);
      setCoverUrl(publicImageUrl(path));
      setStatus({ text: "封面已更新" });
    } catch (e) {
      fail(e, "上傳失敗");
    } finally {
      URL.revokeObjectURL(current.url);
      setBusy(false);
      reset();
    }
  }

  async function remove() {
    if (!confirm("確定移除封面？")) return;
    setBusy(true);
    const result = await removePostCover(postId);
    setBusy(false);
    if (!result.ok) return setStatus({ error: true, text: result.error });
    setCoverUrl(null);
    setStatus({ text: "封面已移除" });
  }

  return (
    <section className="flex flex-col gap-4 border border-line-strong bg-white p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg">封面</h2>
        <p className="text-xs leading-[1.7] text-ink-3">文章列表與文章頁最上方的大圖，比例 3:2。可以不放。上傳、更換、移除都會立即生效。</p>
      </div>
      <div className="flex flex-wrap items-start gap-5">
        <div className="relative aspect-[3/2] w-full max-w-[360px] overflow-hidden bg-surface">
          {coverUrl ? (
            <NextImage src={coverUrl} alt={title} fill quality={90} sizes="360px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-4">尚未設定</div>
          )}
        </div>
        <div className="flex flex-col items-start gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={coverUrl ? "secondary" : "primary"} disabled={busy} onClick={() => input.current?.click()}>
              {busy ? "處理中…" : coverUrl ? "更換封面" : "上傳封面"}
            </Button>
            {coverUrl && (
              <button
                type="button"
                disabled={busy}
                onClick={remove}
                className="rounded-[4px] border border-error px-2 py-1 text-xs text-error transition-colors hover:bg-error hover:text-white disabled:opacity-40"
              >
                移除
              </button>
            )}
          </div>
          {status && (
            <p role="status" className={status.error ? "text-sm text-error" : "text-sm text-ink-2"}>
              {status.text}
            </p>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        hidden
        onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
      />
      {source && (
        <CropDialog
          src={source.url}
          title="文章封面"
          crops={COVER_CROP}
          onCancel={() => {
            URL.revokeObjectURL(source.url);
            setSource(null);
            reset();
          }}
          onConfirm={save}
        />
      )}
    </section>
  );
}

// ─────────────── 刪除 ───────────────

function DeletePostButton({ id, title }: { id: string; title: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`確定刪除「${title}」？文章與裡面的圖片都會刪除，無法復原。`)) return;
          start(async () => {
            const result = await deletePost(id);
            if (result && !result.ok) setError(result.error);
          });
        }}
        className="text-sm text-error hover:underline disabled:opacity-40"
      >
        {pending ? "刪除中…" : "刪除這篇文章"}
      </button>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
