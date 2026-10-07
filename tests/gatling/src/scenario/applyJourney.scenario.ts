import { scenario } from "@gatling.io/core";
import {
  seedSession,
  selectOfficeAccount,
  submitOfficeAccount,
} from "../page/officeAccountsPage.js";

export const applyJourneyScenario = scenario("Apply journey — happy path")
  .exec(seedSession)
  .pause(1, 2)
  .exec(selectOfficeAccount)
  .pause(1, 2)
  .exec(submitOfficeAccount);
