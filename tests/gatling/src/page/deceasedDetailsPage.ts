import { exec, css } from "@gatling.io/core";
import type { ChainBuilder } from "@gatling.io/core";
import { http, status } from "@gatling.io/http";

const csrfCheck = css("input[name=_csrf]", "value").saveAs("csrfToken");

export const getDeceasedName: ChainBuilder = exec(
  http("GET deceased name")
    .get("/apply/deceased-details/name")
    .check(status().is(200))
    .check(csrfCheck),
);

export const submitDeceasedName: ChainBuilder = exec(
  http("POST deceased name")
    .post("/apply/deceased-details/name")
    .formParam("_csrf", "#{csrfToken}")
    .formParam("deceased-first-name", "Test")
    .formParam("deceased-last-name", "Deceased")
    .disableFollowRedirect()
    .check(status().is(302)),
);

export const getDateOfDeath: ChainBuilder = exec(
  http("GET date of death")
    .get("/apply/deceased-details/dod")
    .check(status().is(200))
    .check(csrfCheck),
);

export const submitDateOfDeath: ChainBuilder = exec(
  http("POST date of death")
    .post("/apply/deceased-details/dod")
    .formParam("_csrf", "#{csrfToken}")
    .formParam("deceased-date-of-death-day", "1")
    .formParam("deceased-date-of-death-month", "1")
    .formParam("deceased-date-of-death-year", "2024")
    .disableFollowRedirect()
    .check(status().is(302)),
);

export const getDateOfBirth: ChainBuilder = exec(
  http("GET date of birth")
    .get("/apply/deceased-details/dob")
    .check(status().is(200))
    .check(csrfCheck),
);

export const submitDateOfBirth: ChainBuilder = exec(
  http("POST date of birth")
    .post("/apply/deceased-details/dob")
    .formParam("_csrf", "#{csrfToken}")
    .formParam("deceased-date-of-birth-day", "1")
    .formParam("deceased-date-of-birth-month", "1")
    .formParam("deceased-date-of-birth-year", "1950")
    .disableFollowRedirect()
    .check(status().is(302)),
);

export const getClientRelationship: ChainBuilder = exec(
  http("GET client relationship")
    .get("/apply/deceased-details/client-relationship")
    .check(status().is(200))
    .check(csrfCheck),
);

export const submitClientRelationship: ChainBuilder = exec(
  http("POST client relationship")
    .post("/apply/deceased-details/client-relationship")
    .formParam("_csrf", "#{csrfToken}")
    .formParam("deceased-has-client-relationship", "true")
    .formParam("deceased-client-relationship", "Spouse")
    .disableFollowRedirect()
    .check(status().is(302)),
);

export const getCoronerReference: ChainBuilder = exec(
  http("GET coroner reference")
    .get("/apply/deceased-details/coroner-reference")
    .check(status().is(200))
    .check(csrfCheck),
);

export const submitCoronerReference: ChainBuilder = exec(
  http("POST coroner reference")
    .post("/apply/deceased-details/coroner-reference")
    .formParam("_csrf", "#{csrfToken}")
    .formParam("deceased-coroner-reference", "TEST-REF-123")
    .disableFollowRedirect()
    .check(status().is(302)),
);

export const getFurtherInformation: ChainBuilder = exec(
  http("GET further information")
    .get("/apply/deceased-details/further-information")
    .check(status().is(200))
    .check(csrfCheck),
);

export const submitFurtherInformation: ChainBuilder = exec(
  http("POST further information")
    .post("/apply/deceased-details/further-information")
    .formParam("_csrf", "#{csrfToken}")
    .formParam("deceased-has-further-information", "false")
    .disableFollowRedirect()
    .check(status().is(302)),
);
