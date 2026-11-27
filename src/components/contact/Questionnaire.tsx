"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createReferenceUploads, submitQuestionnaire } from "@/app/(site)/contact/actions";
import { Button } from "@/components/ui/Button";
import { resizeImage } from "@/lib/admin/resize";
import { cn } from "@/lib/cn";
import {
  INQUIRY_UPLOADS_BUCKET,
  MAX_REFERENCE_IMAGES,
  OTHER,
  isRequired,
  otherKey,
  questionnaireSections,
  validateQuestionnaire,
  type Question,
  type QuestionnaireErrors,
  type QuestionnaireValues,
} from "@/lib/questionnaire";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const inputClass =
  "w-full rounded-[4px] border border-line-strong bg-white px-3.5 py-2.5 text-[15px] text-black placeholder:text-ink-4 transition-colors focus:border-black focus:outline-none aria-[invalid=true]:border-error";

const chipClass =
  "inline-flex rounded-full border border-line-strong px-3.5 py-1.5 text-[13.5px] text-ink transition-colors hover:border-ink-3 peer-checked:border-black peer-checked:bg-black peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-link";

type Photo = { file: File; url: string };

/**
 * 詳細問卷：基本資料已經存檔之後才出現，分成幾頁填。
 * 每一頁按「下一步」時先在瀏覽器檢查該頁；最後一頁送出時伺服器會再整份檢查一次。
 * 可以略過，略過就直接看到感謝畫面（基本資料不受影響）。
 */
export function Questionnaire({
  id,
  token,
  onDone,
}: {
  id: string;
  token: string;
  /** 送出或略過之後呼叫，外層換成感謝畫面 */
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<QuestionnaireValues>({});
  const [errors, setErrors] = useState<QuestionnaireErrors>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const section = questionnaireSections[step];
  const last = step === questionnaireSections.length - 1;

  // 換頁或出現錯誤時捲回問卷開頭，手機上才不會停在頁面中間
  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [step]);

  // 離開畫面時釋放預覽圖佔用的記憶體
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  function removePhoto(photo: Photo) {
    URL.revokeObjectURL(photo.url);
    setPhotos(photos.filter((x) => x !== photo));
  }

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  function showErrors(found: QuestionnaireErrors) {
    setErrors(found);
    setMessage("有幾題需要修正，請再確認一次。");
    // 跳到第一個有錯的那一頁
    const firstBad = questionnaireSections.findIndex((s) =>
      s.questions.some((q) => found[q.id] || found[otherKey(q.id)]),
    );
    if (firstBad >= 0 && firstBad !== step) setStep(firstBad);
    else topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function next() {
    const checked = validateQuestionnaire(values, section.questions);
    if (!checked.ok) return showErrors(checked.errors);
    setMessage(null);
    setStep(step + 1);
  }

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const picked = [...files].filter((f) => f.type.startsWith("image/"));
    const room = MAX_REFERENCE_IMAGES - photos.length;
    setPhotos([...photos, ...picked.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }))]);
    if (fileRef.current) fileRef.current.value = "";
  }

  /** 參考圖：先在瀏覽器縮小，再用伺服器發的一次性網址直接傳到儲存空間。回傳成功幾張。 */
  async function uploadPhotos(): Promise<number | null> {
    if (!photos.length) return 0;
    setProgress("準備上傳參考圖…");
    const grant = await createReferenceUploads(id, token, photos.length);
    if (!grant.ok) {
      setMessage(grant.error);
      return null;
    }
    const supabase = createSupabaseBrowserClient();
    for (const [n, photo] of photos.entries()) {
      setProgress(`上傳參考圖 ${n + 1} / ${photos.length}…`);
      try {
        const { blob } = await resizeImage(photo.file, { maxEdge: 2000, quality: 0.85 });
        const { error } = await supabase.storage
          .from(INQUIRY_UPLOADS_BUCKET)
          .uploadToSignedUrl(grant.uploads[n].path, grant.uploads[n].token, blob, { contentType: "image/jpeg" });
        if (error) throw error;
      } catch {
        setMessage(`第 ${n + 1} 張參考圖上傳失敗。可以移除這張再送出，之後用 LINE 或 Email 傳給我們。`);
        return null;
      }
    }
    return photos.length;
  }

  function submit() {
    const checked = validateQuestionnaire(values);
    if (!checked.ok) return showErrors(checked.errors);
    setMessage(null);
    startTransition(async () => {
      const uploaded = await uploadPhotos();
      if (uploaded === null) return setProgress(null);
      setProgress("送出中…");
      const result = await submitQuestionnaire(id, token, values, uploaded);
      setProgress(null);
      if (result.ok) return onDone();
      if (result.fieldErrors) showErrors(result.fieldErrors);
      setMessage(result.error);
    });
  }

  return (
    <div ref={topRef} className="flex scroll-mt-28 flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p role="status" className="rounded-[4px] bg-surface px-4 py-3 text-sm leading-[1.8] text-ink">
          基本資料已經收到，我們會在兩個工作天內與您聯繫。
          <br />
          如果方便，請再花幾分鐘填寫下面的問卷，第一次見面就能談得更具體。
        </p>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl">{section.title}</h2>
          <span className="text-xs text-ink-3 tabular-nums">
            {step + 1} / {questionnaireSections.length}
          </span>
        </div>
        <p className="text-sm leading-[1.8] text-ink-2">{section.description}</p>
      </div>

      {message && (
        <p role="alert" className="rounded-[4px] border border-error px-4 py-3 text-sm text-error">
          {message}
        </p>
      )}

      {section.questions.map((q) => (
        <QuestionField key={q.id} q={q} values={values} errors={errors} set={set} />
      ))}

      {last && (
        <div className="flex flex-col gap-2.5">
          <div className="text-sm text-ink">
            期望的空間感覺
            <span className="ml-2 text-xs text-ink-3">參考圖，最多 {MAX_REFERENCE_IMAGES} 張，可不傳</span>
          </div>
          {photos.length > 0 && (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {photos.map((p, n) => (
                <li key={p.url} className="relative aspect-square overflow-hidden bg-warm-gray">
                  {/* 本機預覽圖，不經過 next/image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={`參考圖 ${n + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(p)}
                    disabled={pending}
                    className="absolute right-1 top-1 rounded-[4px] bg-black px-1.5 py-0.5 text-[11px] text-white"
                  >
                    移除
                  </button>
                </li>
              ))}
            </ul>
          )}
          {photos.length < MAX_REFERENCE_IMAGES && (
            <label className="w-fit cursor-pointer rounded-[4px] border-[1.5px] border-black px-[14px] py-[7px] text-[13px] font-medium text-black hover:bg-surface-hover">
              選擇照片
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => addPhotos(e.target.files)}
              />
            </label>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2">
        {last ? (
          <Button size="lg" fullWidth arrow disabled={pending} onClick={submit}>
            {progress ?? "送出問卷"}
          </Button>
        ) : (
          <Button size="lg" fullWidth arrow onClick={next}>
            下一步
          </Button>
        )}
        <div className="flex justify-between gap-4">
          {step > 0 ? (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStep(step - 1)}>
              上一步
            </Button>
          ) : (
            <span />
          )}
          <Button size="sm" variant="ghost" disabled={pending} onClick={onDone}>
            略過問卷
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuestionField({
  q,
  values,
  errors,
  set,
}: {
  q: Question;
  values: QuestionnaireValues;
  errors: QuestionnaireErrors;
  set: (key: string, value: string) => void;
}) {
  const value = values[q.id] ?? "";
  const error = errors[q.id];
  const required = isRequired(q, values);
  const label = (
    <>
      {q.label}
      {required && <span className="text-error"> *</span>}
    </>
  );
  const errorText = error && (
    <p id={`qe-${q.id}`} className="text-[13px] text-error">
      {error}
    </p>
  );

  if (q.type === "text" || q.type === "textarea") {
    const props = {
      id: `q-${q.id}`,
      value,
      placeholder: q.placeholder,
      "aria-invalid": error ? (true as const) : undefined,
      "aria-describedby": error ? `qe-${q.id}` : undefined,
    };
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={`q-${q.id}`} className="text-sm text-ink">
          {label}
        </label>
        {q.type === "text" ? (
          <input {...props} onChange={(e) => set(q.id, e.target.value)} className={inputClass} />
        ) : (
          <textarea
            {...props}
            rows={3}
            onChange={(e) => set(q.id, e.target.value)}
            className={cn(inputClass, "resize-y leading-[1.8]")}
          />
        )}
        {errorText}
      </div>
    );
  }

  const options =
    q.type === "scale"
      ? Array.from({ length: q.max - q.min + 1 }, (_, n) => String(q.min + n))
      : [...q.options, ...(q.other ? [OTHER] : [])];
  const other = otherKey(q.id);

  return (
    <fieldset className="flex flex-col gap-2.5" aria-describedby={error ? `qe-${q.id}` : undefined}>
      <legend className="mb-2.5 text-sm text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className="cursor-pointer">
            <input
              type="radio"
              name={`q-${q.id}`}
              value={o}
              checked={value === o}
              onChange={() => set(q.id, o)}
              className="peer sr-only"
            />
            <span className={cn(chipClass, q.type === "scale" && "min-w-[38px] justify-center px-0 tabular-nums")}>{o}</span>
          </label>
        ))}
      </div>
      {q.type === "scale" && (
        <div className="flex justify-between gap-4 text-xs text-ink-3">
          <span>
            {q.min}：{q.minLabel}
          </span>
          <span className="text-right">
            {q.max}：{q.maxLabel}
          </span>
        </div>
      )}
      {q.type === "choice" && q.other && value === OTHER && (
        <>
          <input
            aria-label={`${q.label}：其他`}
            value={values[other] ?? ""}
            placeholder="請填寫"
            aria-invalid={errors[other] ? true : undefined}
            onChange={(e) => set(other, e.target.value)}
            className={inputClass}
          />
          {errors[other] && <p className="text-[13px] text-error">{errors[other]}</p>}
        </>
      )}
      {errorText}
    </fieldset>
  );
}
