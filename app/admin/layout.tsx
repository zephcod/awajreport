import { NavShell } from "@/components/SideNav";

const ITEMS = [
  { href: "/admin", label: "Dashboard", code: "01" },
  { href: "/admin/issues", label: "Issues", code: "02" },
  { href: "/admin/campaigns", label: "Campaign assignments", code: "03" },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <NavShell items={ITEMS} subtitle="Admin Control" homeHref="/">
      {children}
    </NavShell>
  );
}
