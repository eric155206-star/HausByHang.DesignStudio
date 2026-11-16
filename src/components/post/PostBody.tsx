import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { isOwnImage, safeHref, type PostDoc, type PostNode } from "@/lib/posts/content";

/**
 * 把文章內文的結構畫成畫面。每一種區塊（標題、段落、清單、圖片…）對應一種標籤，
 * 認不得的一律略過，所以不需要、也不會用到 dangerouslySetInnerHTML。
 * 樣式在 globals.css 的 .post-body，後台編輯器也套同一組，寫的時候看到的就是發佈後的樣子。
 */
function renderText(node: PostNode, key: number): ReactNode {
  let el: ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") el = <strong>{el}</strong>;
    else if (mark.type === "italic") el = <em>{el}</em>;
    else if (mark.type === "underline") el = <u>{el}</u>;
    else if (mark.type === "strike") el = <s>{el}</s>;
    else if (mark.type === "link") {
      const href = safeHref(mark.attrs?.href);
      if (!href) continue;
      el = href.startsWith("/") ? (
        <Link href={href}>{el}</Link>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {el}
        </a>
      );
    }
  }
  return <span key={key}>{el}</span>;
}

function renderNodes(nodes: PostNode[] | undefined): ReactNode {
  return (nodes ?? []).map((node, i) => renderNode(node, i));
}

function renderNode(node: PostNode, key: number): ReactNode {
  switch (node.type) {
    case "text":
      return renderText(node, key);
    case "paragraph":
      return <p key={key}>{renderNodes(node.content)}</p>;
    case "heading":
      return node.attrs?.level === 3 ? (
        <h3 key={key}>{renderNodes(node.content)}</h3>
      ) : (
        <h2 key={key}>{renderNodes(node.content)}</h2>
      );
    case "bulletList":
      return <ul key={key}>{renderNodes(node.content)}</ul>;
    case "orderedList":
      return (
        <ol key={key} start={typeof node.attrs?.start === "number" ? node.attrs.start : 1}>
          {renderNodes(node.content)}
        </ol>
      );
    case "listItem":
      return <li key={key}>{renderNodes(node.content)}</li>;
    case "blockquote":
      return <blockquote key={key}>{renderNodes(node.content)}</blockquote>;
    case "horizontalRule":
      return <hr key={key} />;
    case "hardBreak":
      return <br key={key} />;
    case "image": {
      const { src, alt, width, height } = node.attrs ?? {};
      if (!isOwnImage(src)) return null;
      const text = typeof alt === "string" ? alt : "";
      if (typeof width === "number" && typeof height === "number") {
        return (
          <Image
            key={key}
            src={src}
            alt={text}
            width={width}
            height={height}
            quality={90}
            sizes="(min-width: 800px) 720px, 100vw"
          />
        );
      }
      // 沒有尺寸資料時退回原生 img
      // eslint-disable-next-line @next/next/no-img-element
      return <img key={key} src={src} alt={text} loading="lazy" />;
    }
    default:
      return null;
  }
}

export function PostBody({ doc }: { doc: PostDoc }) {
  return <div className="post-body">{renderNodes(doc.content)}</div>;
}
