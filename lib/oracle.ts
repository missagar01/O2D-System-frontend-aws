// lib/oracle.ts
import oracledb from "oracledb";

const preferredMode = process.env.ORACLE_CLIENT_MODE?.toLowerCase() ?? "thin";
const clientLibDir = process.env.ORACLE_CLIENT_LIB_DIR;
const shouldInitThick =
  preferredMode === "thick" || (!!clientLibDir && preferredMode !== "thin");

// Initialize the Oracle client only when thick mode is explicitly requested.
// Vercel/serverless typically must run in thin mode because native client
// libraries are unavailable.
if (shouldInitThick && oracledb.thin) {
  try {
    oracledb.initOracleClient({
      libDir: clientLibDir,
    });
    console.log("✅ Oracle Instant Client initialized (Thick mode)");
  } catch (err: any) {
    if (err.message?.includes("DPI-1047")) {
      console.error("❌ Cannot locate Oracle Instant Client. Set ORACLE_CLIENT_LIB_DIR.");
    } else if (err.message?.includes("DPI-1050")) {
      console.log("ℹ️ Oracle client already initialized.");
    } else {
      console.error("⚠️ Oracle client initialization error:", err?.message || err);
    }
  }
}

console.log("🔍 OracleDB mode:", oracledb.thin ? "Thin" : "Thick");

let pool: oracledb.Pool | null = null;

/**
 * Create and return an Oracle DB connection pool.
 */
export async function getOraclePool(): Promise<oracledb.Pool> {
  if (pool) return pool;

  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION_STRING,
    poolMin: Number(process.env.ORACLE_POOL_MIN ?? 1),
    poolMax: Number(process.env.ORACLE_POOL_MAX ?? 5),
    poolIncrement: Number(process.env.ORACLE_POOL_INCREMENT ?? 1),
  });

  console.log("✅ Oracle connection pool created");
  return pool;
}

/**
 * Execute a SQL query and return the result rows.
 */
export async function executeQuery(query: string, binds: any[] = []) {
  const pool = await getOraclePool();
  const conn = await pool.getConnection();

  try {
    const result = await conn.execute(query, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    return result.rows;
  } finally {
    await conn.close();
  }
}
