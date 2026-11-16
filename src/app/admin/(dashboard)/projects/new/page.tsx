import type { Metadata } from "next";
import Link from "next/link";
import { NewProjectForm } from "@/components/admin/NewProjectForm";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "新增作品" };

export default async function NewProjectPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/projects" className="text-sm text-link hover:underline">
        ← 作品列表
      </Link>
      <h1 className="text-2xl">新增作品</h1>
      <NewProjectForm />
    </div>
  );
}
