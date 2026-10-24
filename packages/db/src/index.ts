import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

export * from "./schema/index";

let client: ReturnType<typeof postgres> | undefined;

export function getDb(connectionString?: string) {
  const url =
    connectionString ||
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/akg_algo";
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!client) {
    client = postgres(url);
  }

  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof getDb>;
