/**
 * Temporary, focused setup: adds the `calls` and `results` integer
 * attributes to the existing `insights_daily` collection. Idempotent.
 *
 *   results = leads + calls + page follows + engagement + messaging
 *             conversations started (summed from Meta at sync time)
 *
 * Run: npm run db:setup4
 */
import "dotenv/config";
import { Client, Databases } from "node-appwrite";

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

async function main() {
  console.log("Adding calls + results to insights_daily…\n");
  await ignore409(
    () => databases.createIntegerAttribute(dbId, "insights_daily", "calls", false, undefined, undefined, 0),
    "attr calls"
  );
  await ignore409(
    () => databases.createIntegerAttribute(dbId, "insights_daily", "results", false, undefined, undefined, 0),
    "attr results"
  );
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
