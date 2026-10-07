import { scenario } from "@gatling.io/core";
import {
  seedSession,
  selectOfficeAccount,
  submitOfficeAccount,
} from "../page/officeAccountsPage.js";
import {
  getNameAndDob,
  submitNameAndDob,
  getNino,
  submitNino,
  getHasPrevApplication,
  submitHasPrevApplication,
  getHomeAddress,
  submitHomeAddress,
  getCorrespondenceAddressSource,
  submitCorrespondenceAddressSource,
  getCorrespondenceRecipient,
  submitCorrespondenceRecipient,
} from "../page/clientDetailsPage.js";

export const applyJourneyScenario = scenario("Apply journey — happy path")
  .exec(seedSession)
  .pause(1, 2)
  .exec(selectOfficeAccount)
  .pause(1, 2)
  .exec(submitOfficeAccount)
  .pause(1, 2)
  .exec(getNameAndDob)
  .pause(1, 2)
  .exec(submitNameAndDob)
  .pause(1, 2)
  .exec(getNino)
  .pause(1, 2)
  .exec(submitNino)
  .pause(1, 2)
  .exec(getHasPrevApplication)
  .pause(1, 2)
  .exec(submitHasPrevApplication)
  .pause(1, 2)
  .exec(getHomeAddress)
  .pause(1, 2)
  .exec(submitHomeAddress)
  .pause(1, 2)
  .exec(getCorrespondenceAddressSource)
  .pause(1, 2)
  .exec(submitCorrespondenceAddressSource)
  .pause(1, 2)
  .exec(getCorrespondenceRecipient)
  .pause(1, 2)
  .exec(submitCorrespondenceRecipient);
