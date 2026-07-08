import { Pool, type PoolConfig, type QueryResultRow } from "pg";

const globalForPg = globalThis as unknown as {
  hireveriCandidatePgPool?: Pool;
};

function env(name: string) {
  return process.env[name]?.trim().replace(/^["']|["']$/g, "");
}

function getConnectionString() {
  return (
    env("DB_POOL_URL") ||
    env("POSTGRES_PRISMA_URL") ||
    env("POSTGRES_URL") ||
    env("DATABASE_URL") ||
    env("POSTGRES_URL_NON_POOLING")
  );
}

function buildConnectionConfig(): PoolConfig {
  const connectionString = getConnectionString();

  if (connectionString) {
    const url = new URL(connectionString);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (
      process.env.DB_POOL_MODE !== "session" &&
      url.hostname.endsWith(".pooler.supabase.com") &&
      (!url.port || url.port === "5432")
    ) {
      url.port = "6543";
      url.searchParams.set("pgbouncer", "true");
    }

    url.searchParams.delete("sslmode");
    url.searchParams.delete("sslcert");
    url.searchParams.delete("sslkey");
    url.searchParams.delete("sslrootcert");

    return {
      connectionString: url.toString(),
      ssl: local || env("DB_SSL") === "false" ? false : { rejectUnauthorized: false },
      max: Number(env("PG_POOL_MAX") || 2),
      idleTimeoutMillis: Number(env("PG_IDLE_TIMEOUT_MS") || 10000),
      connectionTimeoutMillis: Number(env("PG_CONNECTION_TIMEOUT_MS") || 6000),
    };
  }

  return {
    host: env("DB_HOST"),
    port: Number(env("DB_PORT") || 5432),
    user: env("DB_USER"),
    password: env("DB_PASSWORD"),
    database: env("DB_NAME"),
    ssl: env("DB_SSL") === "true" ? { rejectUnauthorized: false } : false,
    max: Number(env("PG_POOL_MAX") || 2),
    idleTimeoutMillis: Number(env("PG_IDLE_TIMEOUT_MS") || 10000),
    connectionTimeoutMillis: Number(env("PG_CONNECTION_TIMEOUT_MS") || 6000),
  };
}

export function getPgPool() {
  if (!globalForPg.hireveriCandidatePgPool) {
    globalForPg.hireveriCandidatePgPool = new Pool(buildConnectionConfig());
  }

  return globalForPg.hireveriCandidatePgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return getPgPool().query<T>(text, values);
}
