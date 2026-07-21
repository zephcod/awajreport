import { getCampaigns, getCompany, getCosts, getInsights } from "./data";
import {
  computeTotals,
  DEFAULT_CURRENCY_MULTIPLIER,
  rangeToDates,
  VAT_RATE,
  WHT_RATE,
  WHT_THRESHOLD,
  type Company,
  type InsightDaily,
} from "./domain";

export const OTHER_PARENT = "__other__";

export interface StatementGroupRow {
  id: string;
  name: string;
  ads: number;
  impressions: number;
  reach: number;
  clicks: number;
  leads: number;
  calls: number;
  spend: number;
}

export interface StatementData {
  company: Company;
  parentKey: string;
  parentLabel: string;
  since: string;
  until: string;
  cur: string;
  rows: StatementGroupRow[];
  totals: ReturnType<typeof computeTotals>;
  costTotal: number;
  subtotal: number;
  vat: number;
  wht: number;
  totalCharge: number;
  totalPayable: number;
  costs: { category: string; description?: string; date: string; amount: number; metaCampaignId: string }[];
  parentOptions: { value: string; label: string }[];
}

/**
 * Compute a single-parent-group statement. Shared by the statement page
 * and the email sender so the numbers always agree.
 */
export async function buildStatement(
  companyId: string,
  rangeKey: string | undefined,
  parentParam: string | undefined
): Promise<StatementData | null> {
  const company = await getCompany(companyId);
  if (!company) return null;

  const { since, until } = rangeToDates(rangeKey ?? "30d");
  const [rawRows, campaigns, allCosts] = await Promise.all([
    getInsights(companyId, since, until),
    getCampaigns(companyId),
    getCosts(companyId, since, until),
  ]);

  const multiplier = company.currencyMultiplier ?? DEFAULT_CURRENCY_MULTIPLIER;
  const allRows = rawRows.map((r) => ({ ...r, spend: r.spend * multiplier }));
  const cur = company.currency || "ETB";
  const campaignName = new Map(campaigns.map((c) => [c.metaCampaignId, c.name]));
  const adCountOf = new Map(campaigns.map((c) => [c.metaCampaignId, c.adCount ?? 0]));

  const parentKeyFor = (metaCampaignId: string): string => {
    const c = campaigns.find((x) => x.metaCampaignId === metaCampaignId);
    return c?.parentCampaign?.trim() || OTHER_PARENT;
  };
  const groupKeys = [
    ...new Set(campaigns.map((c) => c.parentCampaign?.trim() || OTHER_PARENT)),
  ].sort((a, b) => {
    if (a === OTHER_PARENT) return 1;
    if (b === OTHER_PARENT) return -1;
    return a.localeCompare(b);
  });
  if (groupKeys.length === 0) groupKeys.push(OTHER_PARENT);

  const parentKey = groupKeys.includes(parentParam ?? "")
    ? (parentParam as string)
    : groupKeys[0];
  const parentLabel = parentKey === OTHER_PARENT ? "Other campaigns" : parentKey;

  const groupCampaignIds = new Set(
    campaigns
      .filter((c) => (c.parentCampaign?.trim() || OTHER_PARENT) === parentKey)
      .map((c) => c.metaCampaignId)
  );
  const rows = allRows.filter((r) => groupCampaignIds.has(r.metaCampaignId));
  const costs = allCosts.filter((c) => groupCampaignIds.has(c.metaCampaignId));

  const byCampaign = new Map<string, InsightDaily[]>();
  for (const r of rows) {
    const list = byCampaign.get(r.metaCampaignId) ?? [];
    list.push(r);
    byCampaign.set(r.metaCampaignId, list);
  }
  const groupRows: StatementGroupRow[] = [...byCampaign.entries()]
    .map(([id, list]) => {
      const t = computeTotals(list);
      return {
        id,
        name: campaignName.get(id) ?? id,
        ads: adCountOf.get(id) ?? 0,
        impressions: t.impressions,
        reach: t.reach,
        clicks: t.clicks,
        leads: t.leads,
        calls: t.calls,
        spend: t.spend,
      };
    })
    .sort((a, b) => b.spend - a.spend);

  const totals = computeTotals(rows);
  const costTotal = costs.reduce((n, c) => n + c.amount, 0);
  const subtotal = totals.spend + costTotal;
  const vat = subtotal * VAT_RATE;
  const wht = subtotal > WHT_THRESHOLD ? subtotal * WHT_RATE : 0;
  const totalCharge = subtotal + vat;
  const totalPayable = totalCharge - wht;

  return {
    company,
    parentKey,
    parentLabel,
    since,
    until,
    cur,
    rows: groupRows,
    totals,
    costTotal,
    subtotal,
    vat,
    wht,
    totalCharge,
    totalPayable,
    costs: costs.map((c) => ({
      category: c.category,
      description: c.description,
      date: c.date,
      amount: c.amount,
      metaCampaignId: c.metaCampaignId,
    })),
    parentOptions: groupKeys.map((k) => ({
      value: k,
      label: k === OTHER_PARENT ? "Other campaigns" : k,
    })),
  };
}
