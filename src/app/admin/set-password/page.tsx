import type { Metadata } from "next";
import { SetPasswordForm } from "@/components/admin/SetPasswordForm";

export const metadata: Metadata = { title: "設定密碼" };

/** 邀請信與重設密碼信的落地頁。 */
export default function SetPasswordPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-5 py-[clamp(48px,10vh,120px)]">
      <h1 className="text-2xl">設定密碼</h1>
      <SetPasswordForm />
    </div>
  );
}
