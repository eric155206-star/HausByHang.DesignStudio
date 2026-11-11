import type { Metadata } from "next";
import { ContactCta } from "@/components/layout/ContactCta";
import { PageHeader, Placeholder } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "設計流程",
  description: "從初步諮詢到完工交屋的六個步驟。",
};

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Process" title="設計流程" />
      <Placeholder>六個設計流程步驟將在下一步加入</Placeholder>
      <ContactCta />
    </>
  );
}
