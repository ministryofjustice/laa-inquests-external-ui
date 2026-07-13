/**
 * API Handlers for MSW
 *
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to external APIs and serve mock responses.
 */

import { http, HttpResponse, passthrough } from "msw";

// This is a UUID that exists in the coroners_letter table in the UAT database
// It can be recreated by using the /applications/upload-coroners-letter endpoint in the UAT environment
const coronersLetterId = "1c84c788-23c4-49e7-a07e-6b391f09c116";
const coronersLetterFileName = "test_coroners_letter.pdf";

// As a temporary measure, until we stop using mocks for e2e tests, this is used to populate the database
const bypassCreateApplicationMocks =
  process.env.PLAYWRIGHT_BYPASS_CREATE_APPLICATION_MOCKS === "true";

export const apiHandlers = [
  http.post(
    `${process.env.INQUESTS_API_URL}/applications/upload-coroners-letter`,
    () =>
      HttpResponse.json(
        {
          coronersLetterId: coronersLetterId,
          coronersLetterFileName: coronersLetterFileName,
        },
        { status: 201 },
      ),
  ),
  http.post("*/applications", async () => {
    if (bypassCreateApplicationMocks) {
      return passthrough();
    }

    return HttpResponse.json(
      {
        laaReference: 123,
      },
      { status: 201 },
    );
  }),
  http.post("*/applications/*/claim", async () =>
    HttpResponse.json(
      {
        claimId: 42,
        laaReference: 1,
        claimTypeId: "PAYMENT_ON_ACCOUNT",
        statusId: "PENDING",
        submissionDate: "2026-07-07T12:25:08.407881",
        totalProfitCostNet: 1000,
        totalProfitCostGross: 1200,
        claimantId: "test@example.com",
        poaTypeId: "PROFIT_COST",
      },
      { status: 201 },
    ),
  ),
];
