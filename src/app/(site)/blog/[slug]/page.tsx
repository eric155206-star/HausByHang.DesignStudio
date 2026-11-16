import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCta } from "@/components/layout/ContactCta";
import { PostBody } from "@/components/post/PostBody";
import { formatPostDate, getPublishedPost, getPublishedPosts } from "@/lib/data/posts";

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  // Cache Components 規定至少要回傳一組參數；還沒有文章時給一個不存在的 slug，頁面會顯示 404
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      type: "article",
      publishedTime: post.date || undefined,
      images: post.cover ? [{ url: post.cover.src }] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  return (
    <>
      <article className="container-page flex flex-col gap-[clamp(28px,4vw,48px)] pb-[clamp(56px,8vw,112px)] pt-[clamp(28px,4vw,48px)]">
        <Link href="/blog" className="self-start text-sm font-medium text-link hover:underline">
          ← 文章
        </Link>
        <header className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
          <time dateTime={post.date} className="eyebrow tabular-nums">
            {formatPostDate(post.date)}
          </time>
          <h1 className="text-[clamp(30px,4.4vw,52px)] leading-[1.35] tracking-[0.02em]">{post.title}</h1>
          {post.excerpt && <p className="text-[clamp(16px,1.8vw,19px)] font-light leading-[1.9] text-ink-2 text-pretty">{post.excerpt}</p>}
        </header>
        {post.cover && (
          <div className="relative mx-auto aspect-[3/2] w-full max-w-[1000px] overflow-hidden bg-warm-gray">
            <Image src={post.cover.src} alt="" fill priority quality={90} sizes="(min-width: 1100px) 1000px, 100vw" className="object-cover" />
          </div>
        )}
        <div className="mx-auto w-full max-w-[720px]">
          <PostBody doc={post.content} />
        </div>
      </article>
      <ContactCta />
    </>
  );
}
