import type { Metadata } from "next";
import { ContactCta } from "@/components/layout/ContactCta";
import { PageHeader, Placeholder } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "文章",
  description: "老屋翻新、裝修預算與居家規劃的實用文章。",
};

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Journal" title="文章" />
      <Placeholder>文章列表將在後台完成後加入</Placeholder>
      <ContactCta />
    </>
  );
}
