import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/PostEditor";
import { requireAdmin } from "@/lib/admin/auth";
import { sanitizeDoc } from "@/lib/posts/content";
import { publicImageUrl } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "編輯文章" };

export default async function EditPostPage({ params }: PageProps<"/admin/posts/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const { supabase } = await requireAdmin();
  const { data: post } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_image_path, content, is_published, published_on")
    .eq("id", id)
    .maybeSingle();
  if (!post) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/posts" className="text-sm text-link hover:underline">
        ← 文章列表
      </Link>
      <PostEditor
        key={post.id}
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          coverUrl: post.cover_image_path ? publicImageUrl(post.cover_image_path) : null,
          content: sanitizeDoc(post.content),
          isPublished: post.is_published,
          publishedOn: post.published_on ?? "",
        }}
      />
    </div>
  );
}
