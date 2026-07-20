"use server";

import { revalidatePath } from "next/cache";
import { createIssue } from "@/lib/data";
import { getSession } from "@/lib/server-session";

export async function submitIssue(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Clients can only file issues for their own company.
  const requested = String(formData.get("companyId") ?? "");
  const companyId = session.role === "admin" ? requested : session.cid;
  if (!companyId) throw new Error("Missing company");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) throw new Error("Title and details are required");

  await createIssue({ companyId, title: title.slice(0, 256), body: body.slice(0, 4096) });
  revalidatePath(`/r/${companyId}/issues`);
  revalidatePath("/admin/issues");
}
