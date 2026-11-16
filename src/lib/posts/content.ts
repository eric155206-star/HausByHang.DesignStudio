import { supabaseUrl } from "@/lib/supabase/config";

/**
 * 文章內文的資料結構（Tiptap 編輯器輸出的 JSON）與清理規則。
 * 內文不是存 HTML，而是存「這是一個標題、這是一段文字、這是一張圖」這種結構。
 * 存檔前用 sanitizeDoc 只留下認得的結構，前台再依結構畫出來，所以不會有人能塞進惡意的 HTML 或 script。
 */
export type PostMark = { type: string; attrs?: Record<string, unknown> };
export type PostNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PostNode[];
  marks?: PostMark[];
  text?: string;
};
export type PostDoc = { type: "doc"; content: PostNode[] };

export const EMPTY_DOC: PostDoc = { type: "doc", content: [] };

const BLOCKS = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "horizontalRule",
  "hardBreak",
  "image",
  "text",
]);
const MARKS = new Set(["bold", "italic", "underline", "strike", "link"]);

/** 連結只接受一般網址、站內路徑、mailto、tel，擋掉 javascript: 之類的危險寫法。 */
export function safeHref(href: unknown): string | null {
  if (typeof href !== "string") return null;
  const v = href.trim();
  if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v;
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  return null;
}

/** 文章圖片只接受自己 Storage 裡的檔案。 */
export function isOwnImage(src: unknown): src is string {
  return typeof src === "string" && !!supabaseUrl && src.startsWith(`${supabaseUrl}/storage/v1/object/public/`);
}

function positiveInt(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : null;
}

function cleanNode(node: unknown, depth: number): PostNode | null {
  if (!node || typeof node !== "object" || depth > 12) return null;
  const n = node as PostNode;
  if (typeof n.type !== "string" || !BLOCKS.has(n.type)) return null;

  if (n.type === "text") {
    if (typeof n.text !== "string" || !n.text) return null;
    const marks = (Array.isArray(n.marks) ? n.marks : [])
      .filter((m) => m && typeof m.type === "string" && MARKS.has(m.type))
      .map((m): PostMark | null => {
        if (m.type !== "link") return { type: m.type };
        const href = safeHref(m.attrs?.href);
        return href ? { type: "link", attrs: { href } } : null;
      })
      .filter((m): m is PostMark => !!m);
    return marks.length ? { type: "text", text: n.text, marks } : { type: "text", text: n.text };
  }

  if (n.type === "image") {
    if (!isOwnImage(n.attrs?.src)) return null;
    return {
      type: "image",
      attrs: {
        src: n.attrs.src,
        alt: typeof n.attrs.alt === "string" ? n.attrs.alt.slice(0, 200) : "",
        width: positiveInt(n.attrs.width),
        height: positiveInt(n.attrs.height),
      },
    };
  }

  const out: PostNode = { type: n.type };
  if (n.type === "heading") out.attrs = { level: n.attrs?.level === 3 ? 3 : 2 };
  if (n.type === "orderedList") out.attrs = { start: positiveInt(n.attrs?.start) ?? 1 };
  if (Array.isArray(n.content)) {
    const children = n.content.map((c) => cleanNode(c, depth + 1)).filter((c): c is PostNode => !!c);
    if (children.length) out.content = children;
  }
  return out;
}

export function sanitizeDoc(input: unknown): PostDoc {
  if (!input || typeof input !== "object") return EMPTY_DOC;
  const content = (input as PostDoc).content;
  if (!Array.isArray(content)) return EMPTY_DOC;
  return { type: "doc", content: content.map((c) => cleanNode(c, 0)).filter((c): c is PostNode => !!c) };
}

/** 內文裡用到的圖片路徑（Storage 裡的相對路徑），刪文章或清理沒用到的圖片時用。 */
export function imageSrcs(doc: PostDoc): string[] {
  const found: string[] = [];
  const walk = (nodes: PostNode[]) => {
    for (const n of nodes) {
      if (n.type === "image" && typeof n.attrs?.src === "string") found.push(n.attrs.src);
      if (n.content) walk(n.content);
    }
  };
  walk(doc.content);
  return found;
}

/** 純文字長度，判斷文章是不是空的。 */
export function isEmptyDoc(doc: PostDoc): boolean {
  const hasContent = (nodes: PostNode[]): boolean =>
    nodes.some((n) => n.type === "image" || (n.type === "text" && !!n.text?.trim()) || (n.content ? hasContent(n.content) : false));
  return !hasContent(doc.content);
}
