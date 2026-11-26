import type { Metadata } from "next";
import { ContactCta } from "@/components/layout/ContactCta";
import { PageHeader, Placeholder } from "@/components/layout/PageHeader";
import { FrameCard, FrameGrid } from "@/components/ui/FrameCard";
import { formatPostDate, getPublishedPosts } from "@/lib/data/posts";

export const metadata: Metadata = {
  title: "文章",
  description: "老屋翻新、裝修預算與居家規劃的實用文章。",
};

export default async function Page() {
  const posts = await getPublishedPosts();
  return (
    <div className="bg-surface">
      <PageHeader eyebrow="Journal" title="文章" />
      {posts.length === 0 ? (
        <Placeholder>第一篇文章正在撰寫中，敬請期待。</Placeholder>
      ) : (
        <section className="container-page pb-[clamp(56px,8vw,112px)]">
          <FrameGrid>
            {posts.map((post) => (
              <FrameCard
                key={post.slug}
                href={`/blog/${post.slug}`}
                meta={formatPostDate(post.date)}
                image={post.cover ? { src: post.cover.src, alt: "" } : null}
                imageAspect="aspect-[3/2]"
                title={post.title}
                text={post.excerpt}
              />
            ))}
          </FrameGrid>
        </section>
      )}
      <ContactCta />
    </div>
  );
}
