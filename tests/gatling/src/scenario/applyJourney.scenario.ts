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
import { getProceeding, submitProceeding } from "../page/proceedingPage.js";
import {
  getDeceasedName,
  submitDeceasedName,
  getDateOfDeath,
  submitDateOfDeath,
  getDateOfBirth,
  submitDateOfBirth,
  getClientRelationship,
  submitClientRelationship,
  getCoronerReference,
  submitCoronerReference,
  getFurtherInformation,
  submitFurtherInformation,
} from "../page/deceasedDetailsPage.js";
import {
  getPublicAuthority,
  submitPublicAuthority,
} from "../page/publicAuthorityPage.js";
import {
  getCoronersLetter,
  uploadCoronersLetter,
  continueCoronersLetter,
} from "../page/coronersLetterPage.js";

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
  .exec(submitCorrespondenceRecipient)
  .pause(1, 2)
  .exec(getProceeding)
  .pause(1, 2)
  .exec(submitProceeding)
  .pause(1, 2)
  .exec(getDeceasedName)
  .pause(1, 2)
  .exec(submitDeceasedName)
  .pause(1, 2)
  .exec(getDateOfDeath)
  .pause(1, 2)
  .exec(submitDateOfDeath)
  .pause(1, 2)
  .exec(getDateOfBirth)
  .pause(1, 2)
  .exec(submitDateOfBirth)
  .pause(1, 2)
  .exec(getClientRelationship)
  .pause(1, 2)
  .exec(submitClientRelationship)
  .pause(1, 2)
  .exec(getCoronerReference)
  .pause(1, 2)
  .exec(submitCoronerReference)
  .pause(1, 2)
  .exec(getFurtherInformation)
  .pause(1, 2)
  .exec(submitFurtherInformation)
  .pause(1, 2)
  .exec(getPublicAuthority)
  .pause(1, 2)
  .exec(submitPublicAuthority)
  .pause(1, 2)
  .exec(getCoronersLetter)
  .pause(1, 2)
  .exec(uploadCoronersLetter)
  .pause(1, 2)
  .exec(getCoronersLetter)
  .pause(1, 2)
  .exec(continueCoronersLetter);
