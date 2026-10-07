import { exec, css } from "@gatling.io/core";
import type { ChainBuilder } from "@gatling.io/core";
import { http, status } from "@gatling.io/http";
import { clientDetailsData } from "../data/clientDetailsData.js";

const csrfCheck = css("input[name=_csrf]", "value").saveAs("csrfToken");

export const getNameAndDob: ChainBuilder = exec(
  http("GET name and dob")
    .get("/apply/client-details/name-and-dob")
    .check(status().is(200))
    .check(csrfCheck),
);

export const submitNameAndDob: ChainBuilder = exec(
  http("POST name and dob")
    .post("/apply/client-details/name-and-dob")
    .formParam("_csrf", "#{csrfToken}")
    .formParam("first-name", clientDetailsData.firstName)
    .formParam("last-name", clientDetailsData.lastName)
    .formParam("name-change", "false")
    .formParam("dob-day", clientDetailsData.dobDay)
    .formParam("dob-month", clientDetailsData.dobMonth)
    .formParam("dob-year", clientDetailsData.dobYear)
    .disableFollowRedirect()
    .check(status().is(302)),
);

export const getNino: ChainBuilder = exec(
  http("GET nino")
    .get("/apply/client-details/nino")
    .check(status().is(200))
    .check(csrfCheck),
);

export const submitNino: ChainBuilder = exec(
  http("POST nino")
    .post("/apply/client-details/nino")
    .formParam("_csrf", "#{csrfToken}")
    .formParam("has-nino", "false")
    .disableFollowRedirect()
    .check(status().is(302)),
);

export const getHasPrevApplication: ChainBuilder = exec(
  http("GET has prev application")
    .get("/apply/client-details/has-prev-application")
    .check(status().is(200))
    .check(csrfCheck),
);

export const submitHasPrevApplication: ChainBuilder = exec(
  http("POST has prev application")
    .post("/apply/client-details/has-prev-application")
    .formParam("_csrf", "#{csrfToken}")
    .formParam("has-prev-application", "false")
    .disableFollowRedirect()
    .check(status().is(302)),
);

export const getHomeAddress: ChainBuilder = exec(
  http("GET home address")
    .get("/apply/client-details/home-address")
    .check(status().is(200))
    .check(csrfCheck),
);

export const submitHomeAddress: ChainBuilder = exec(
  http("POST home address")
    .post("/apply/client-details/home-address")
    .formParam("_csrf", "#{csrfToken}")
    .formParam("home-address-line-1", clientDetailsData.homeAddressLine1)
    .formParam("home-town-or-city", clientDetailsData.homeTownOrCity)
    .formParam("home-postcode", clientDetailsData.homePostcode)
    .disableFollowRedirect()
    .check(status().is(302)),
);

export const getCorrespondenceAddressSource: ChainBuilder = exec(
  http("GET correspondence address source")
    .get("/apply/client-details/correspondence-address-source")
    .check(status().is(200))
    .check(csrfCheck),
);

// Uses the client's home address, which skips the separate
// correspondence-address step (see ClientDetails.adaptor.ts).
export const submitCorrespondenceAddressSource: ChainBuilder = exec(
  http("POST correspondence address source")
    .post("/apply/client-details/correspondence-address-source")
    .formParam("_csrf", "#{csrfToken}")
    .formParam("correspondence-address-source", "USE_CLIENT_HOME_ADDRESS")
    .disableFollowRedirect()
    .check(status().is(302)),
);

export const getCorrespondenceAddress: ChainBuilder = exec(
  http("GET correspondence address")
    .get("/apply/client-details/correspondence-address")
    .check(status().is(200))
    .check(csrfCheck),
);

export const submitCorrespondenceAddress: ChainBuilder = exec(
  http("POST correspondence address")
    .post("/apply/client-details/correspondence-address")
    .formParam("_csrf", "#{csrfToken}")
    .formParam(
      "correspondence-address-line-1",
      clientDetailsData.correspondenceAddressLine1,
    )
    .formParam(
      "correspondence-town-or-city",
      clientDetailsData.correspondenceTownOrCity,
    )
    .formParam("correspondence-postcode", clientDetailsData.correspondencePostcode)
    .disableFollowRedirect()
    .check(status().is(302)),
);

export const getCorrespondenceRecipient: ChainBuilder = exec(
  http("GET correspondence recipient")
    .get("/apply/client-details/correspondence-recipient")
    .check(status().is(200))
    .check(csrfCheck),
);

export const submitCorrespondenceRecipient: ChainBuilder = exec(
  http("POST correspondence recipient")
    .post("/apply/client-details/correspondence-recipient")
    .formParam("_csrf", "#{csrfToken}")
    .formParam("correspondence-recipient", "PERSON")
    .formParam(
      "correspondence-recipient-person-name",
      clientDetailsData.correspondenceRecipientPersonName,
    )
    .disableFollowRedirect()
    .check(status().is(302)),
);
