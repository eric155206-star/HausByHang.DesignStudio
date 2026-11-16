"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { submitInquiry } from "@/app/(site)/contact/actions";
import { Button } from "@/components/ui/Button";
import {
  budgets,
  houseConditions,
  houseTypes,
  spaceTypes,
  type InquiryField,
  type InquiryState,
} from "@/lib/inquiry";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";

const inputClass =
  "w-full rounded-[4px] border border-line-strong bg-white px-3.5 py-2.5 text-[15px] text-black placeholder:text-ink-4 transition-colors focus:border-black focus:outline-none aria-[invalid=true]:border-error";

export function ContactForm() {
  const [state, action, pending] = useActionState<InquiryState, FormData>(submitInquiry, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  // 送出失敗時，把游標移到第一個有錯的欄位（手機上會自動捲過去）
  useEffect(() => {
    if (state.status !== "error") return;
    const first = formRef.current?.querySelector<HTMLElement>("[aria-invalid=true], fieldset[aria-describedby] input");
    (first ?? formRef.current?.querySelector<HTMLElement>("[role=alert]"))?.focus({ preventScroll: false });
  }, [state]);

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col items-start gap-5 py-6">
        <Image src="/brand/mark.png" alt="" width={44} height={44} />
        <h2 className="text-2xl">謝謝您的來信</h2>
        <p className="text-[15px] leading-[1.9] text-ink-2">我們會在兩個工作天內與您聯繫。</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          再填一份
        </Button>
      </div>
    );
  }

  const err = state.status === "error" ? state.fieldErrors ?? {} : {};
  const val = state.status === "error" ? state.values ?? {} : {};
  const field = (name: InquiryField) => ({
    name,
    id: `f-${name}`,
    defaultValue: val[name] ?? "",
    "aria-invalid": err[name] ? true : undefined,
    "aria-describedby": err[name] ? `e-${name}` : undefined,
  });

  return (
    <form
      // React 送出後會把表單重設為 defaultValue；伺服器帶回的值已放進 defaultValue，所以不用重填
      ref={formRef}
      action={action}
      noValidate
      className="flex flex-col gap-6"
    >
      {state.status === "error" && (
        <p role="alert" tabIndex={-1} className="rounded-[4px] border border-error px-4 py-3 text-sm text-error">
          {state.message}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="姓名" required name="name" error={err.name}>
          <input {...field("name")} autoComplete="name" className={inputClass} />
        </Field>
        <Field label="聯絡電話" required name="phone" error={err.phone}>
          <input {...field("phone")} type="tel" autoComplete="tel" inputMode="tel" placeholder="0912345678" className={inputClass} />
        </Field>
        <Field label="LINE ID" name="lineId" error={err.lineId}>
          <input {...field("lineId")} className={inputClass} />
        </Field>
        <Field label="Email" name="email" error={err.email}>
          <input {...field("email")} type="email" autoComplete="email" className={inputClass} />
        </Field>
      </div>

      <ChoiceGroup label="空間類型" required name="spaceType" options={spaceTypes} value={val.spaceType} error={err.spaceType} />
      <ChoiceGroup label="房屋現況" required name="houseCondition" options={houseConditions} value={val.houseCondition} error={err.houseCondition} />

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="房屋類型" name="houseType" error={err.houseType}>
          <select {...field("houseType")} className={inputClass}>
            <option value="">請選擇</option>
            {houseTypes.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Field>
        <Field label="屋齡（年）" name="houseAge" error={err.houseAge}>
          <input {...field("houseAge")} inputMode="numeric" className={inputClass} />
        </Field>
        <Field label="地區" required name="region" error={err.region}>
          <input {...field("region")} placeholder="例如 新北 板橋" className={inputClass} />
        </Field>
        <Field label="約略坪數" name="area" error={err.area}>
          <input {...field("area")} inputMode="decimal" className={inputClass} />
        </Field>
      </div>

      <ChoiceGroup label="預算區間" required name="budget" options={budgets} value={val.budget} error={err.budget} hint="含設計與工程" />

      <Field label="想解決的問題" name="message" error={err.message} hint="屋況、家庭成員、預計入住時間，或期待的生活樣貌。">
        <textarea {...field("message")} rows={5} className={cn(inputClass, "resize-y leading-[1.8]")} />
      </Field>

      {/* Honeypot：人看不到，機器人會填 */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          公司名稱
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <PrivacyNotice />

      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            name="consent"
            defaultChecked={val.consent === "on"}
            aria-invalid={err.consent ? true : undefined}
            aria-describedby={err.consent ? "e-consent" : undefined}
            className="mt-[5px] size-4 shrink-0 accent-black"
          />
          <span>
            我已閱讀並同意上述個人資料告知事項<span className="text-error"> *</span>
          </span>
        </label>
        {err.consent && <ErrorText id="e-consent">{err.consent}</ErrorText>}
      </div>

      <Button type="submit" size="lg" fullWidth arrow disabled={pending}>
        {pending ? "送出中…" : "送出需求"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  name: InquiryField;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`f-${name}`} className="text-sm text-ink">
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ink-3">{hint}</p>}
      {error && <ErrorText id={`e-${name}`}>{error}</ErrorText>}
    </div>
  );
}

/** Tag 樣式的單選題。底層是原生 radio，鍵盤與螢幕報讀器都能用。 */
function ChoiceGroup({
  label,
  name,
  options,
  value,
  required,
  error,
  hint,
}: {
  label: string;
  name: InquiryField;
  options: readonly string[];
  value?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2.5" aria-describedby={error ? `e-${name}` : undefined}>
      <legend className="mb-2.5 text-sm text-ink">
        {label}
        {required && <span className="text-error"> *</span>}
        {hint && <span className="ml-2 text-xs text-ink-3">{hint}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className="cursor-pointer">
            <input type="radio" name={name} value={o} defaultChecked={value === o} className="peer sr-only" />
            <span className="inline-flex rounded-full border border-line-strong px-3.5 py-1.5 text-[13.5px] text-ink transition-colors hover:border-ink-3 peer-checked:border-black peer-checked:bg-black peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-link">
              {o}
            </span>
          </label>
        ))}
      </div>
      {error && <ErrorText id={`e-${name}`}>{error}</ErrorText>}
    </fieldset>
  );
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-[13px] text-error">
      {children}
    </p>
  );
}

/** 個資法第 8 條告知事項。正式上線前建議請律師確認文字。 */
function PrivacyNotice() {
  return (
    <details className="rounded-[4px] bg-surface px-4 py-3 text-[13px] leading-[1.8] text-ink-2">
      <summary className="cursor-pointer text-ink">個人資料蒐集告知事項</summary>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5">
        <li>蒐集者：{site.nameZh}（{site.name}）。</li>
        <li>蒐集目的：回覆您的室內設計諮詢、安排丈量與提供設計服務（客戶管理與服務）。</li>
        <li>個人資料類別：姓名、電話、LINE ID、Email，以及您填寫的房屋與需求資訊。</li>
        <li>利用期間：自蒐集日起至蒐集目的完成，或您要求刪除為止。</li>
        <li>利用地區與對象：僅限臺灣地區，由本公司人員用於聯繫與服務，不提供給第三方。</li>
        <li>您的權利：可依個人資料保護法第 3 條，來信 {site.email} 請求查詢、閱覽、製給複本、補充或更正、停止蒐集處理利用或刪除。</li>
        <li>若您選擇不提供必填資料，我們將無法與您聯繫或提供服務。</li>
      </ol>
    </details>
  );
}
