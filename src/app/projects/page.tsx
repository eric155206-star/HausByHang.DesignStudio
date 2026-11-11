import type { Metadata } from "next";
import { ContactCta } from "@/components/layout/ContactCta";
import { PageHeader, Placeholder } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "作品集",
  description: "沆設計的老屋翻新、住宅與商業空間作品。",
};

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Works" title="作品集" />
      <Placeholder>作品列表將在下一步加入，可依住宅、商業空間、老屋篩選</Placeholder>
      <ContactCta />
    </>
  );
}
