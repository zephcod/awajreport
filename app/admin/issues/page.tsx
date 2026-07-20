import { replyToIssue } from "@/app/admin/actions";
import { IssueStatusSelect } from "@/components/IssueStatusSelect";
import { getCompanies, getIssues } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminIssuesPage() {
  const [issues, companies] = await Promise.all([getIssues(), getCompanies()]);
  const companyName = new Map(companies.map((c) => [c.$id, c.name]));
  const open = issues.filter((i) => i.status !== "resolved");
  const resolved = issues.filter((i) => i.status === "resolved");

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="font-display text-sm font-semibold text-amber">
          Awaj ET · Reports Admin
        </p>
        <h1 className="mt-1 text-3xl font-bold">Issues</h1>
        <p className="mt-1 text-sm text-warmgray">
          {open.length} open · {resolved.length} resolved
        </p>
      </header>

      {issues.length === 0 && (
        <div className="rounded-xl border border-line bg-white px-6 py-10 text-center text-warmgray shadow-sm">
          No client issues yet.
        </div>
      )}

      <ul className="space-y-4">
        {[...open, ...resolved].map((issue) => (
          <li
            key={issue.$id}
            className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber">
                  {companyName.get(issue.companyId) ?? issue.companyId}
                </p>
                <p className="mt-0.5 font-medium">{issue.title}</p>
                <p className="mt-0.5 text-xs text-warmgray">
                  {new Date(issue.$createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <IssueStatusSelect issueId={issue.$id} current={issue.status} />
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm text-charcoal/90">
              {issue.body}
            </p>

            <form action={replyToIssue} className="mt-4 flex items-start gap-2">
              <input type="hidden" name="id" value={issue.$id} />
              <textarea
                name="response"
                rows={2}
                maxLength={4096}
                defaultValue={issue.response ?? ""}
                placeholder="Reply to the client…"
                className="w-full rounded-md border border-charcoal/20 bg-white px-3 py-2 text-sm text-charcoal focus:border-gold focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-md bg-gold px-4 py-2 text-sm font-medium text-navy transition hover:bg-amber"
              >
                Reply
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
