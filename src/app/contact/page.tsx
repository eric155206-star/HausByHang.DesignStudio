import type { Metadata } from "next";
import { PageHeader, Placeholder } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "預約諮詢",
  description: "告訴我們您的空間與期待，我們會在兩個工作天內與您聯繫，安排初步諮詢。",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="預約諮詢"
        aside="告訴我們您的空間與期待。收到需求後，我們會在兩個工作天內與您聯繫，安排初步諮詢。"
      />
      <Placeholder>預約諮詢表單將在下一步加入</Placeholder>
    </>
  );
}
