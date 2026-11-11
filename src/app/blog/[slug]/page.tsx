import { notFound } from "next/navigation";

// 文章在第 4 步改成從 Supabase 讀取。
// Cache Components 規定動態路由至少要預先產生一個網址，所以先放一個示範代碼，實際打開會是 404。
export function generateStaticParams() {
  return [{ slug: "sample" }];
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  await params;
  notFound();
}
