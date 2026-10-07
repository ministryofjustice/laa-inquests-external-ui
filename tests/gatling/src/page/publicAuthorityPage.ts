import { exec, css } from "@gatling.io/core";
import type { ChainBuilder } from "@gatling.io/core";
import { http, status } from "@gatling.io/http";

const csrfCheck = css("input[name=_csrf]", "value").saveAs("csrfToken");

// Options come from a real API call (GetPublicAuthorities), so the value is
// scraped from the rendered page rather than hardcoded.
export const getPublicAuthority: ChainBuilder = exec(
  http("GET public authority")
    .get("/apply/public-authority")
    .check(status().is(200))
    .check(csrfCheck)
    .check(
      css('input[name="publicAuthorityOption"]', "value").saveAs(
        "publicAuthorityOption",
      ),
    ),
);

export const submitPublicAuthority: ChainBuilder = exec(
  http("POST public authority")
    .post("/apply/public-authority")
    .formParam("_csrf", "#{csrfToken}")
    .formParam("publicAuthorityOption", "#{publicAuthorityOption}")
    .disableFollowRedirect()
    .check(status().is(302)),
);
