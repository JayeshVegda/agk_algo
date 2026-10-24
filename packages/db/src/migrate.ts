import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function runMigrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in environment");
  }

  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  console.log("Applying database migrations...");
  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, "../migrations"),
  });
  console.log("Migrations applied successfully.");

  await migrationClient.end();
  process.exit(0);
}

runMigrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
