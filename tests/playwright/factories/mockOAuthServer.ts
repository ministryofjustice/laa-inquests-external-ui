import express from "express";
import type { Request, Response } from "express";
import { MOCK_OAUTH_PORT } from "#src/adaptors/source/auth/MockAuth.adaptor.js";

export function startMockOAuthServer(): void {
  const app = express();

  app.get("/authorize", (req: Request, res: Response): void => {
    const { redirect_uri } = req.query as { redirect_uri: string };
    const params = new URLSearchParams({ code: "test-user-id" });
    res.redirect(`${redirect_uri}?${params.toString()}`);
  });

  app.listen(MOCK_OAUTH_PORT, () => {
    console.log(`🔐 Mock OAuth server started on port ${MOCK_OAUTH_PORT}`);
  });
}
