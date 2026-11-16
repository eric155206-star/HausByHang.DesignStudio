"use client";

import { useActionState } from "react";
import { saveProject, type ProjectFormState } from "@/app/admin/(dashboard)/projects/actions";
import { Button } from "@/components/ui/Button";
import { adminInput } from "./styles";

export type ProjectFormValues = {
  id: string;
  title: string;
  slug: string;
  subtitle_en: string | null;
  category: "residential" | "commercial";
  is_old_house: boolean;
  location: string | null;
  area_ping: number | null;
  completed_year: number | null;
  summary: string | null;
  description: string | null;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  cover_image_path: string | null;
};

export function ProjectForm({ project }: { project: ProjectFormValues }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(saveProject.bind(null, project.id), {
    status: "idle",
  });
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5 border border-line-strong bg-white p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Text label="作品名稱" name="title" value={project.title} error={err.title} required />
        <Text label="網址代碼" name="slug" value={project.slug} error={err.slug} required hint="hausbyhang.com/projects/這裡" />
        <Text label="英文小標" name="subtitle_en" value={project.subtitle_en} error={err.subtitle_en} hint="例如 Banqiao · Residence" />
        <Text label="地點" name="location" value={project.location} error={err.location} hint="例如 新北 板橋" />
        <label className="flex flex-col gap-2 text-sm">
          類型
          <select name="category" defaultValue={project.category} className={adminInput}>
            <option value="residential">住宅</option>
            <option value="commercial">商業空間</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-5">
          <Text label="坪數" name="area_ping" value={project.area_ping} error={err.area_ping} inputMode="decimal" />
          <Text label="完工年份" name="completed_year" value={project.completed_year} error={err.completed_year} inputMode="numeric" />
        </div>
      </div>

      <TextArea label="短述" name="summary" value={project.summary} rows={2} hint="作品卡片與 Google 搜尋結果用，一兩句話。" />
      <TextArea label="案例描述" name="description" value={project.description} rows={6} hint="作品內頁主圖下方的文字。" />

      <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
        <Check name="is_old_house" checked={project.is_old_house} label="老屋（作品集可篩選）" />
        <Check name="is_featured" checked={project.is_featured} label="放在首頁精選" />
        <Check name="is_published" checked={project.is_published} label="發佈到網站" />
        <label className="flex items-center gap-2">
          排序
          <input name="sort_order" defaultValue={project.sort_order} inputMode="numeric" className={`${adminInput} w-20`} />
          <span className="text-xs text-ink-3">數字小的排前面</span>
        </label>
      </div>
      {!project.cover_image_path && (
        <p className="text-xs text-ink-3">發佈前需要先在下方照片區選一張「設為封面」。</p>
      )}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "儲存中…" : "儲存"}
        </Button>
        {state.message && (
          <p role="status" className={state.status === "error" ? "text-sm text-error" : "text-sm text-ink-2"}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function Text({
  label,
  name,
  value,
  error,
  hint,
  required,
  inputMode,
}: {
  label: string;
  name: string;
  value: string | number | null;
  error?: string;
  hint?: string;
  required?: boolean;
  inputMode?: "decimal" | "numeric";
}) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span>
        {label}
        {required && <span className="text-error"> *</span>}
      </span>
      <input
        name={name}
        defaultValue={value ?? ""}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        className={adminInput}
      />
      {hint && !error && <span className="text-xs text-ink-3">{hint}</span>}
      {error && <span className="text-[13px] text-error">{error}</span>}
    </label>
  );
}

function TextArea({ label, name, value, rows, hint }: { label: string; name: string; value: string | null; rows: number; hint?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      {label}
      <textarea name={name} defaultValue={value ?? ""} rows={rows} className={`${adminInput} resize-y leading-[1.8]`} />
      {hint && <span className="text-xs text-ink-3">{hint}</span>}
    </label>
  );
}

function Check({ name, checked, label }: { name: string; checked: boolean; label: string }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" name={name} defaultChecked={checked} className="size-4 accent-black" />
      {label}
    </label>
  );
}
