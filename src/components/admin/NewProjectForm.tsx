"use client";

import { useActionState } from "react";
import { createProject, type ProjectFormState } from "@/app/admin/(dashboard)/projects/actions";
import { Button } from "@/components/ui/Button";
import { adminInput } from "./styles";

export function NewProjectForm() {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(createProject, { status: "idle" });
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex max-w-lg flex-col gap-5 border border-line-strong bg-white p-6">
      {state.status === "error" && state.message && <p className="text-sm text-error">{state.message}</p>}
      <label className="flex flex-col gap-2 text-sm">
        作品名稱
        <input name="title" required className={adminInput} aria-invalid={err.title ? true : undefined} placeholder="例如 板橋三民路" />
        {err.title && <span className="text-[13px] text-error">{err.title}</span>}
      </label>
      <label className="flex flex-col gap-2 text-sm">
        網址代碼
        <input name="slug" required className={adminInput} aria-invalid={err.slug ? true : undefined} placeholder="例如 banqiao-sanmin" />
        <span className="text-xs text-ink-3">會成為網址 hausbyhang.com/projects/這裡。只能用小寫英文、數字、連字號，之後也可以改。</span>
        {err.slug && <span className="text-[13px] text-error">{err.slug}</span>}
      </label>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "建立中…" : "建立並開始編輯"}
      </Button>
    </form>
  );
}
