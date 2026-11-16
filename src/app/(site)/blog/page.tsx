import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactCta } from "@/components/layout/ContactCta";
import { PageHeader, Placeholder } from "@/components/layout/PageHeader";
import { formatPostDate, getPublishedPosts } from "@/lib/data/posts";

export const metadata: Metadata = {
  title: "文章",
  description: "老屋翻新、裝修預算與居家規劃的實用文章。",
};

export default async function Page() {
  const posts = await getPublishedPosts();
  return (
    <>
      <PageHeader eyebrow="Journal" title="文章" />
      {posts.length === 0 ? (
        <Placeholder>第一篇文章正在撰寫中，敬請期待。</Placeholder>
      ) : (
        <section className="container-page grid gap-x-[clamp(20px,3vw,40px)] gap-y-[clamp(40px,5vw,64px)] pb-[clamp(56px,8vw,112px)] sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col gap-4">
              <div className="relative aspect-[3/2] overflow-hidden bg-warm-gray">
                {post.cover ? (
                  <Image
                    src={post.cover.src}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-[720ms] ease-brand group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Image src="/brand/mark.png" alt="" width={40} height={40} className="opacity-[0.12]" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-[13px] text-ink-4 tabular-nums">{formatPostDate(post.date)}</div>
                <h2 className="text-xl leading-[1.5] text-black">{post.title}</h2>
                {post.excerpt && <p className="line-clamp-3 text-[14.5px] leading-[1.9] text-ink-2">{post.excerpt}</p>}
              </div>
            </Link>
          ))}
        </section>
      )}
      <ContactCta />
    </>
  );
}
