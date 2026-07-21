import { NavShell } from "@/components/SideNav";

export default async function ReportLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}>) {
  const { companyId } = await params;
  const items = [
    { href: `/r/${companyId}`, label: "Dashboard", code: "01" },
    { href: `/r/${companyId}/issues`, label: "Issues", code: "02" },
  ];
  return (
    <NavShell items={items} subtitle="Client Report" homeHref="/">
      {children}
    </NavShell>
  );
}
