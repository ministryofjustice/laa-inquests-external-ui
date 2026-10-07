import { exec, css } from "@gatling.io/core";
import type { ChainBuilder } from "@gatling.io/core";
import { http, status } from "@gatling.io/http";

const csrfCheck = css("input[name=_csrf]", "value").saveAs("csrfToken");

export const getProceeding: ChainBuilder = exec(
  http("GET proceeding")
    .get("/apply/proceeding")
    .check(status().is(200))
    .check(csrfCheck),
);

export const submitProceeding: ChainBuilder = exec(
  http("POST proceeding")
    .post("/apply/proceeding")
    .formParam("_csrf", "#{csrfToken}")
    .formParam("proceeding-option", "IQPC")
    .disableFollowRedirect()
    .check(status().is(302)),
);
