import type { Metadata } from "next";
import { ContactCta } from "@/components/layout/ContactCta";
import { PageHeader, Placeholder } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "服務項目",
  description: "住宅室內設計、商業空間設計與老屋翻新，以及報價方式說明。",
};

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Services" title="服務項目" />
      <Placeholder>三項服務與報價說明將在下一步加入</Placeholder>
      <ContactCta />
    </>
  );
}
