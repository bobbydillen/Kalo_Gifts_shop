import type { Metadata } from "next";

// The admin is private: keep it out of search results.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · KALO Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex flex-1 flex-col bg-night">{children}</div>;
}
