/**
 * Temporary, focused setup: creates ONLY the `campaign_costs` collection
 * (additional costs — creative production, strategy overhead, consultation…
 * recorded per campaign under a company). Idempotent — safe to re-run.
 *
 * Run: npm run db:setup3
 */
import "dotenv/config";
import { Client, Databases, IndexType } from "node-appwrite";

const endpoint = process.env.APPWRITE_ENDPOINT!;
const projectId = process.env.APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY!;
const dbId = process.env.APPWRITE_DATABASE_ID!;

if (!endpoint || !projectId || !apiKey || !dbId) {
  console.error("Missing env vars — copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function ignore409<T>(fn: () => Promise<T>, label: string): Promise<void> {
  try {
    await fn();
    console.log(`  ✓ ${label}`);
  } catch (e: unknown) {
    const err = e as { code?: number; message?: string };
    if (err.code === 409) {
      console.log(`  • ${label} (already exists)`);
    } else {
      console.error(`  ✗ ${label}: ${err.message}`);
      throw e;
    }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("Setting up campaign_costs…\n");

  await ignore409(
    () => databases.createCollection(dbId, "campaign_costs", "Campaign Costs"),
    "collection"
  );
  await ignore409(
    () => databases.createStringAttribute(dbId, "campaign_costs", "companyId", 36, true),
    "attr companyId"
  );
  await ignore409(
    () => databases.createStringAttribute(dbId, "campaign_costs", "metaCampaignId", 64, true),
    "attr metaCampaignId"
  );
  await ignore409(
    () =>
      databases.createEnumAttribute(
        dbId,
        "campaign_costs",
        "category",
        ["creative_production", "strategy", "consultation", "management", "other"],
        true
      ),
    "attr category"
  );
  await ignore409(
    () => databases.createStringAttribute(dbId, "campaign_costs", "description", 512, false),
    "attr description"
  );
  await ignore409(
    () => databases.createFloatAttribute(dbId, "campaign_costs", "amount", true),
    "attr amount"
  );
  await ignore409(
    () => databases.createStringAttribute(dbId, "campaign_costs", "date", 10, true),
    "attr date"
  );

  await sleep(2000);
  await ignore409(
    () =>
      databases.createIndex(dbId, "campaign_costs", "idx_cost_company_date", IndexType.Key, [
        "companyId",
        "date",
      ]),
    "index idx_cost_company_date"
  );

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
