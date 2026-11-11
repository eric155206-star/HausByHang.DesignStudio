import type { Metadata } from "next";
import { ContactCta } from "@/components/layout/ContactCta";
import { PageHeader, Placeholder } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "關於",
  description: "認識沆設計 haus by hang. 的設計理念與團隊。",
};

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="About" title="關於" />
      <Placeholder>品牌理念與負責人介紹將在下一步加入</Placeholder>
      <ContactCta />
    </>
  );
}
