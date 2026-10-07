import { getEnvironmentVariable } from "@gatling.io/core";

export function resolveBaseUrl(): string {
  return getEnvironmentVariable(
    "GATLING_BASE_URL",
    "http://localhost:3000",
  );
}
