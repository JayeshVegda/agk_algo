import { PgBoss } from "pg-boss";
import pino from "pino";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const logger = pino({
  name: "akg-worker",
  level: process.env.LOG_LEVEL || "info",
});

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.error("DATABASE_URL environment variable is missing");
    process.exit(1);
  }

  const boss = new PgBoss({
    connectionString,
    schema: "pgboss",
  });

  boss.on("error", (err: unknown) => {
    logger.error({ err }, "PgBoss background worker error");
  });

  await boss.start();
  logger.info("Worker started, pg-boss listening for jobs");

  // Keep alive & handle graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down worker...");
    await boss.stop();
    logger.info("Worker stopped cleanly");
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, "Fatal worker startup failure");
  process.exit(1);
});
