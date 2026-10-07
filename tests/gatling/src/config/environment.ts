import "dotenv/config";

export function resolveBaseUrl(): string {
  return process.env.GATLING_BASE_URL ?? "http://localhost:3000";
}
