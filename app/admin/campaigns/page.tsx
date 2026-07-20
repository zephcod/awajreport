import Link from "next/link";
import { CampaignAssign } from "@/components/CampaignAssign";
import { CampaignParentInput } from "@/components/CampaignParentInput";
import { SyncButton } from "@/components/SyncButton";
import { getAllCampaigns, getCompanies } from "@/lib/data";
import type { Campaign } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const [campaigns, companies] = await Promise.all([
    getAllCampaigns(),
    getCompanies(),
  ]);
  const options = companies.map((c) => ({ value: c.$id, label: c.name }));
  const companyName = new Map(companies.map((c) => [c.$id, c.name]));
  const knownParents = [
    ...new Set(
      campaigns.map((c) => c.parentCampaign?.trim()).filter((p): p is string => !!p)
    ),
  ].sort();

  // Group campaigns by ad account so shared accounts are easy to scan.
  const byAccount = new Map<string, Campaign[]>();
  for (const c of campaigns) {
    const key = c.adAccountId ?? "Unknown ad account";
    const list = byAccount.get(key) ?? [];
    list.push(c);
    byAccount.set(key, list);
  }
  const accounts = [...byAccount.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-warmgray hover:text-charcoal">
            ← All companies
          </Link>
          <h1 className="mt-1 text-3xl font-bold">Campaign assignments</h1>
          <p className="mt-1 max-w-xl text-sm text-warmgray">
            One ad account can run campaigns for several companies. Assign each
            campaign to the company whose report it belongs in — its data
            (including history) moves with it, and future syncs respect the
            assignment.
          </p>
        </div>
        <SyncButton label="Sync all from Meta" />
      </header>

      {accounts.length === 0 && (
        <div className="rounded-xl border border-line bg-white px-6 py-10 text-center text-warmgray shadow-sm">
          No campaigns yet — run a sync first.
        </div>
      )}

      {accounts.map(([account, list]) => {
        const usedBy = [
          ...new Set(list.map((c) => companyName.get(c.companyId) ?? "?")),
        ];
        return (
          <section
            key={account}
            className="mb-6 rounded-xl border border-line bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-4 sm:px-6">
              <h2 className="font-mono text-sm font-semibold">{account}</h2>
              <p className="text-xs text-warmgray">
                {list.length} campaign{list.length === 1 ? "" : "s"} ·{" "}
                {usedBy.length === 1
                  ? `all assigned to ${usedBy[0]}`
                  : `shared by ${usedBy.join(", ")}`}
              </p>
            </div>
            <ul>
              {list.map((c) => (
                <li
                  key={c.$id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 px-4 py-3 last:border-0 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="text-xs text-warmgray">
                      {[c.objective, c.status].filter(Boolean).join(" · ") ||
                        "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CampaignParentInput
                      campaignId={c.$id}
                      current={c.parentCampaign ?? ""}
                      knownParents={knownParents}
                    />
                    <CampaignAssign
                      campaignId={c.$id}
                      currentCompanyId={c.companyId}
                      companies={options}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
