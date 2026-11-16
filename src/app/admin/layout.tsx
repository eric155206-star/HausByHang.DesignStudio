import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "後台", template: "%s｜沆設計後台" },
  robots: { index: false, follow: false },
};

/** 後台外框：不套用前台 Header / Footer。 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-dvh flex-col bg-surface">{children}</div>;
}
