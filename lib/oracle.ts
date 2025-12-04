// lib/oracle.ts (stub for serverless deployment)
// Oracle client is not bundled in this frontend deployment. These helpers
// throw to avoid accidental usage on Vercel. Host Oracle access in a separate
// backend service and call it via API_BASE_URL.

export async function getOraclePool(): Promise<never> {
  throw new Error("Oracle DB is not available in this deployment.");
}

export async function executeQuery(): Promise<never> {
  throw new Error("Oracle DB is not available in this deployment.");
}
