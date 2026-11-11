"use client";

import { useState, useTransition } from "react";
import { deleteProject } from "@/app/admin/(dashboard)/projects/actions";

export function DeleteProjectButton({ id, title }: { id: string; title: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`確定刪除「${title}」？作品資料與所有照片都會刪除，無法復原。`)) return;
          start(async () => {
            const result = await deleteProject(id);
            if (result && !result.ok) setError(result.error);
          });
        }}
        className="text-sm text-error hover:underline disabled:opacity-40"
      >
        {pending ? "刪除中…" : "刪除這個作品"}
      </button>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
