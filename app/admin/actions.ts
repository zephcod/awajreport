"use server";

import { revalidatePath } from "next/cache";
import {
  createCompany,
  createCost,
  deleteCost,
  reassignCampaign,
  setCampaignParent,
  updateCompany,
  updateInsight,
  updateIssue,
} from "@/lib/data";
import {
  COST_CATEGORIES,
  ISSUE_STATUSES,
  type CostCategory,
  type IssueStatus,
} from "@/lib/domain";
import { normalizeAdAccountId } from "@/lib/meta";
import { requireAdmin } from "@/lib/server-session";
import { buildStatement } from "@/lib/statement";
import { renderStatementEmail } from "@/lib/statement-email";
import { syncAll, syncOne, type CompanySyncResult } from "@/lib/sync";
import { env } from "@/lib/env";
import { Resend } from "resend";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export async function addCompany(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = str(formData, "name");
  const pin = str(formData, "pin");
  if (!name || !/^\d{4,10}$/.test(pin)) {
    throw new Error("Name and a 4–10 digit PIN are required");
  }
  const adAccount = str(formData, "metaAdAccountId");
  await createCompany({
    name,
    pin,
    metaAdAccountId: adAccount ? normalizeAdAccountId(adAccount) : undefined,
    sourceCompany: str(formData, "sourceCompany") || undefined,
    currency: str(formData, "currency") || "ETB",
  });
  revalidatePath("/admin");
}

export async function saveCompany(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  const pin = str(formData, "pin");
  if (!id) throw new Error("Missing company id");
  if (pin && !/^\d{4,10}$/.test(pin)) throw new Error("PIN must be 4–10 digits");
  const adAccount = str(formData, "metaAdAccountId");
  const multiplier = Number(formData.get("currencyMultiplier"));
  await updateCompany(id, {
    name: str(formData, "name") || undefined,
    ...(pin ? { pin } : {}),
    metaAdAccountId: adAccount ? normalizeAdAccountId(adAccount) : undefined,
    accountManager: str(formData, "accountManager") || undefined,
    currency: str(formData, "currency") || "ETB",
    currencyMultiplier: multiplier > 0 ? multiplier : 250,
    active: formData.get("active") === "on",
    notes: str(formData, "notes") || undefined,
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
}

export async function saveInsightRow(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  const companyId = str(formData, "companyId");
  if (!id) throw new Error("Missing row id");
  await updateInsight(id, {
    spend: Number(formData.get("spend")) || 0,
    impressions: Number(formData.get("impressions")) || 0,
    reach: Number(formData.get("reach")) || 0,
    clicks: Number(formData.get("clicks")) || 0,
    leads: Number(formData.get("leads")) || 0,
    calls: Number(formData.get("calls")) || 0,
    results: Number(formData.get("results")) || 0,
  });
  revalidatePath(`/admin/${companyId}`);
  revalidatePath(`/r/${companyId}`);
}

/**
 * Assign a campaign to a company. Historical insight rows move with it,
 * so both companies' reports stay accurate.
 */
export async function assignCampaign(
  campaignId: string,
  companyId: string
): Promise<{ migrated: number }> {
  await requireAdmin();
  const migrated = await reassignCampaign(campaignId, companyId);
  revalidatePath("/admin/campaigns");
  revalidatePath("/admin");
  return { migrated };
}

/** Edit a campaign's parent group from the company manage page. */
export async function saveCampaignDetails(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  const companyId = str(formData, "companyId");
  if (!id) throw new Error("Missing campaign id");
  await setCampaignParent(
    id,
    str(formData, "parentCampaign").slice(0, 256) || null
  );
  revalidatePath(`/admin/${companyId}`);
  revalidatePath("/admin/campaigns");
  revalidatePath(`/r/${companyId}`);
}

/** Set or clear a campaign's parent-campaign group. */
export async function saveCampaignParent(
  campaignId: string,
  parent: string
): Promise<void> {
  await requireAdmin();
  const trimmed = parent.trim().slice(0, 256);
  await setCampaignParent(campaignId, trimmed || null);
  revalidatePath("/admin/campaigns");
}

export async function addCost(formData: FormData): Promise<void> {
  await requireAdmin();
  const companyId = str(formData, "companyId");
  const metaCampaignId = str(formData, "metaCampaignId");
  const category = str(formData, "category");
  const amount = Number(formData.get("amount"));
  const date = str(formData, "date");
  if (!companyId || !metaCampaignId) throw new Error("Pick a campaign");
  if (!COST_CATEGORIES.includes(category as CostCategory)) {
    throw new Error("Invalid category");
  }
  if (!(amount > 0)) throw new Error("Amount must be greater than 0");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid date");
  await createCost({
    companyId,
    metaCampaignId,
    category: category as CostCategory,
    description: str(formData, "description").slice(0, 512) || undefined,
    amount,
    date,
  });
  revalidatePath(`/admin/${companyId}`);
  revalidatePath(`/r/${companyId}`);
}

export async function removeCost(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  const companyId = str(formData, "companyId");
  if (!id) throw new Error("Missing cost id");
  await deleteCost(id);
  revalidatePath(`/admin/${companyId}`);
  revalidatePath(`/r/${companyId}`);
}

export async function setIssueStatus(
  issueId: string,
  status: string
): Promise<void> {
  await requireAdmin();
  if (!ISSUE_STATUSES.includes(status as IssueStatus)) {
    throw new Error("Invalid status");
  }
  await updateIssue(issueId, { status: status as IssueStatus });
  revalidatePath("/admin/issues");
}

export async function replyToIssue(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  const response = str(formData, "response");
  if (!id) throw new Error("Missing issue id");
  await updateIssue(id, { response: response.slice(0, 4096) });
  revalidatePath("/admin/issues");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email a minimized statement for one parent group to a client. */
export async function emailStatement(input: {
  companyId: string;
  to: string;
  range?: string;
  parent?: string;
  summary?: string;
}): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const to = input.to.trim();
  if (!EMAIL_RE.test(to)) return { ok: false, message: "Enter a valid email address." };

  const data = await buildStatement(input.companyId, input.range, input.parent);
  if (!data) return { ok: false, message: "Company not found." };

  try {
    const resend = new Resend(env.resendApiKey());
    const subject = `Campaign statement — ${data.parentLabel} (${data.since} → ${data.until})`;
    const html = await renderStatementEmail(data, input.summary?.slice(0, 2000));
    const { error } = await resend.emails.send({
      from: env.statementFrom(),
      to,
      subject,
      html,
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: `Statement sent to ${to}.` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function runSync(companyId?: string): Promise<CompanySyncResult[]> {
  await requireAdmin();
  const results = companyId ? [await syncOne(companyId)] : await syncAll();
  revalidatePath("/admin");
  if (companyId) {
    revalidatePath(`/admin/${companyId}`);
    revalidatePath(`/r/${companyId}`);
  }
  return results;
}
