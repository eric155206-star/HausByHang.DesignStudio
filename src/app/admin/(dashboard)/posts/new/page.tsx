import type { Metadata } from "next";
import Link from "next/link";
import { NewPostForm } from "@/components/admin/NewPostForm";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "新增文章" };

export default async function NewPostPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/posts" className="text-sm text-link hover:underline">
        ← 文章列表
      </Link>
      <h1 className="text-2xl">新增文章</h1>
      <NewPostForm />
    </div>
  );
}
