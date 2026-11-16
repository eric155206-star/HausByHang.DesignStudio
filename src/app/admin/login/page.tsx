import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { supabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "後台登入" };

async function ForbiddenNotice({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const { error } = await searchParams;
  if (error !== "forbidden") return null;
  return (
    <div className="flex flex-col items-start gap-2 rounded-[4px] border border-error px-4 py-3 text-sm text-error">
      <p>這個帳號沒有後台權限。請確認 Email 已加入管理者白名單。</p>
      <form action={signOut}>
        <button type="submit" className="underline">登出，換一個帳號</button>
      </form>
    </div>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-5 py-[clamp(48px,10vh,120px)]">
      <h1 className="text-2xl">後台登入</h1>
      {supabaseConfigured ? (
        <>
          <Suspense>
            <ForbiddenNotice searchParams={searchParams} />
          </Suspense>
          <LoginForm />
        </>
      ) : (
        <p className="bg-surface px-4 py-3 text-sm leading-[1.8] text-ink-2">
          資料庫尚未設定。請在 Vercel 環境變數加入 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 後重新部署。
        </p>
      )}
    </div>
  );
}
