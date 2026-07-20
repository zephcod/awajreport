# Awaj ET — Campaign Reports

PIN-protected client reporting dashboard for Meta ad campaigns. Built with
Next.js (App Router), Tailwind CSS v4, Radix UI, and Appwrite — designed to
run on a sub-domain (e.g. `reports.awajet.com`) alongside the leadgen admin
app, sharing the same Appwrite database.

## How it works

- **PIN login** — each company has its own PIN (stored on its `companies`
  document). A client enters their PIN at `/login` and is routed to their
  report at `/r/<companyId>`. The `ADMIN_PIN` env var unlocks `/admin`.
- **Middleware security** — every route except `/login` and `/api/sync` is
  protected by edge middleware that verifies an HMAC-signed session cookie.
  Client sessions can only reach their own company's report; anything else
  redirects them home. Rotating `AUTH_SECRET` invalidates all sessions.
- **Meta → Appwrite sync** — `/api/sync` (Bearer `CRON_SECRET`) pulls
  campaign metadata and daily campaign-level insights from the Meta
  Marketing API into Appwrite. A Vercel cron (`vercel.json`) runs it daily
  at 03:00 UTC; admins can also trigger it per company from the UI.
- **Editable data** — admins can correct any daily row. Edited rows are
  flagged and preserved on subsequent syncs.
- **Shared ad accounts** — one ad account can run campaigns for several
  companies. `/admin/campaigns` lists every synced campaign grouped by ad
  account; assign each to a company and its data (including history) moves
  with it. Syncs fetch each shared account only once and route every daily
  row to the campaign's assigned company; newly discovered campaigns
  default to the account's first active company.

## Setup

1. `npm install`
2. Copy `.env.example` → `.env.local` and fill in Appwrite credentials
   (same project/database as the leadgen app), `AUTH_SECRET`, `ADMIN_PIN`,
   `META_ACCESS_TOKEN`, and `CRON_SECRET`.
3. `npm run db:setup` — creates the `companies`, `report_campaigns`, and
   `insights_daily` collections (idempotent; leaves leadgen collections
   untouched). Add `-- --seed-from-contacts` to auto-create companies from
   the distinct `company` values on your leadgen contacts (each gets a
   random 6-digit PIN, printed to the console).
4. `npm run dev` → http://localhost:3001

## Meta access

Create a system user in Meta Business Manager with `ads_read` on each
client ad account, generate a long-lived token, and set it as
`META_ACCESS_TOKEN`. Set each company's `metaAdAccountId`
(e.g. `act_1234567890`) in `/admin`.

## Deploying to a sub-domain

Deploy to Vercel, add the sub-domain (e.g. `reports.awajet.com`) in the
project's domain settings, and point a CNAME at Vercel. Set all env vars in
the Vercel project; `CRON_SECRET` enables the daily cron automatically.

## Data model (Appwrite)

- `companies` — name, unique `pin`, `metaAdAccountId`, `sourceCompany`
  (links to leadgen `contacts.company`), currency, `currencyMultiplier`
  (spend × this on the client report, default 250 — e.g. USD ad account
  shown in ETB; raw synced values stay untouched), active, notes
- `report_campaigns` — companyId, metaCampaignId (unique), adAccountId,
  name, objective, status
- `insights_daily` — companyId, metaCampaignId, date, spend, impressions,
  reach, clicks, leads, `edited` flag, notes
  (unique on companyId + metaCampaignId + date)
- `campaign_costs` — companyId, metaCampaignId, category
  (creative_production / strategy / consultation / management / other),
  description, amount, date. Agency costs recorded per campaign from the
  company Manage page, in report currency (multiplier not applied); shown
  on the client report as "Additional investments" with a total-investment
  figure.
- `report_issues` — companyId, title, body, status
  (open / in_progress / resolved), response. Clients raise issues from
  their report ("02 Issues"); admins reply and set status in /admin/issues.
