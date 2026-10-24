import { getDb } from "./index.js";
import { settings, termsVersions } from "./schema/index.js";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function seed() {
  const db = getDb();

  console.log("Seeding base database records...");

  // Default system settings per docs/DECISIONS.md
  await db
    .insert(settings)
    .values([
      {
        key: "business_timezone",
        value: "UTC",
      },
      {
        key: "allow_mid_cycle_join",
        value: false,
      },
      {
        key: "archive_visible_when_inactive",
        value: true,
      },
      {
        key: "reminder_days",
        value: [7, 3, 1],
      },
      {
        key: "paused_banner_text",
        value: "The current cycle has concluded. The next trading cycle opens soon.",
      },
    ])
    .onConflictDoNothing();

  // Initial terms version
  await db
    .insert(termsVersions)
    .values({
      version: "1.0",
      body: "Initial Terms of Service and Risk Disclosures for AKG ALGO algorithmic trading membership.",
    })
    .onConflictDoNothing();

  console.log("Base database seeding completed.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
