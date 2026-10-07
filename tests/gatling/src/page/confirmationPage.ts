import { exec, css } from "@gatling.io/core";
import type { ChainBuilder } from "@gatling.io/core";
import { http, status } from "@gatling.io/http";

const csrfCheck = css("input[name=_csrf]", "value").saveAs("csrfToken");

export const getCheckYourAnswers: ChainBuilder = exec(
  http("GET check your answers")
    .get("/apply/check-your-answers")
    .check(status().is(200)),
);

export const getClientDeclaration: ChainBuilder = exec(
  http("GET client declaration")
    .get("/apply/confirmation/client-declaration")
    .check(status().is(200))
    .check(csrfCheck),
);

// Submits the real application to the Inquests API.
export const submitClientDeclaration: ChainBuilder = exec(
  http("POST client declaration")
    .post("/apply/confirmation/client-declaration")
    .formParam("_csrf", "#{csrfToken}")
    .formParam("client-declaration-confirmation", "true")
    .disableFollowRedirect()
    .check(status().is(302)),
);

export const getConfirmationSuccess: ChainBuilder = exec(
  http("GET confirmation success")
    .get("/apply/confirmation/success")
    .check(status().is(200)),
);
