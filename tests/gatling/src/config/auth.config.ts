import "dotenv/config";

export function resolveAccessToken(): string {
  const accessToken = process.env.GATLING_ACCESS_TOKEN;
  if (accessToken == null || accessToken === "") {
    throw new Error(
      "GATLING_ACCESS_TOKEN is not set — copy tests/gatling/.env.example to .env and paste a valid access token.",
    );
  }
  return accessToken;
}
