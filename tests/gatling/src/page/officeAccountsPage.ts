import { exec } from "@gatling.io/core";
import type { ChainBuilder } from "@gatling.io/core";
import { http, status } from "@gatling.io/http";
import { css } from "@gatling.io/core";
import {
  resolveAccessToken,
  resolveFirmId,
  resolveOfficeAccounts,
} from "../config/auth.config.js";

// /auth/test-login is only mounted when NODE_ENV=test; it seeds a real
// session carrying a genuine Entra access token for downstream API calls.
// Redirect-following is disabled so the 302 check applies to this response
// itself, not the page it redirects to.
export const seedSession: ChainBuilder = exec(
  http("Seed session via test-login")
    .get(
      `/auth/test-login?accessToken=${encodeURIComponent(resolveAccessToken())}&role=application&officeAccounts=${encodeURIComponent(resolveOfficeAccounts())}&firmId=${encodeURIComponent(resolveFirmId())}`,
    )
    .disableFollowRedirect()
    .check(status().is(302)),
);

export const selectOfficeAccount: ChainBuilder = exec(
  http("GET office accounts")
    .get("/apply/office-accounts")
    .check(status().is(200))
    .check(css("input[name=_csrf]", "value").saveAs("csrfToken"))
    .check(
      css('input[name="office-accounts"]', "value").saveAs("officeAccount"),
    ),
);

export const submitOfficeAccount: ChainBuilder = exec(
  http("POST office accounts")
    .post("/apply/office-accounts")
    .formParam("_csrf", "#{csrfToken}")
    .formParam("office-accounts", "#{officeAccount}")
    .disableFollowRedirect()
    .check(status().is(302)),
);
