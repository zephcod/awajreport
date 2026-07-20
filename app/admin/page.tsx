import Link from "next/link";
import { NewCompanyDialog } from "@/components/NewCompanyDialog";
import { SyncButton } from "@/components/SyncButton";
import { getCompanies } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const companies = await getCompanies();

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-sm font-semibold text-amber">
            Awaj ET · Reports Admin
          </p>
          <h1 className="mt-1 text-3xl font-bold">Companies</h1>
        </div>
        <div className="flex items-center gap-3">
          <SyncButton label="Sync all from Meta" />
          <NewCompanyDialog />
        </div>
      </header>

      <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-warmgray">
              {["Company", "PIN", "Meta ad account", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium sm:px-6">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-warmgray">
                  No companies yet. Create one, or run{" "}
                  <code className="font-mono text-xs">
                    npm run db:setup -- --seed-from-contacts
                  </code>{" "}
                  to seed from your leadgen contacts.
                </td>
              </tr>
            )}
            {companies.map((c) => (
              <tr key={c.$id} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-3 font-medium sm:px-6">{c.name}</td>
                <td className="px-4 py-3 font-mono sm:px-6">{c.pin}</td>
                <td className="px-4 py-3 font-mono text-xs sm:px-6">
                  {c.metaAdAccountId || "—"}
                </td>
                <td className="px-4 py-3 sm:px-6">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      c.active
                        ? "bg-gold/15 text-amber"
                        : "bg-charcoal/10 text-warmgray"
                    }`}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right sm:px-6">
                  <span className="inline-flex items-center gap-3">
                    {c.metaAdAccountId ? (
                      <SyncButton companyId={c.$id} label="Sync" compact />
                    ) : (
                      <span
                        title="Set a Meta ad account ID in Manage to enable sync"
                        className="cursor-help text-xs text-warmgray/60"
                      >
                        No ad account
                      </span>
                    )}
                    <Link
                      href={`/r/${c.$id}`}
                      className="text-amber hover:underline"
                    >
                      View report
                    </Link>
                    <Link
                      href={`/admin/${c.$id}`}
                      className="text-charcoal hover:underline"
                    >
                      Manage
                    </Link>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
