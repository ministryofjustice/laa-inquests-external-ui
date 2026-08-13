/**
 * API Handlers for MSW
 *
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to external APIs and serve mock responses.
 */

import { http, HttpResponse, passthrough } from "msw";

// This is a UUID that exists in the coroners_letter table in the dev database
// It can be recreated by using the /applications/upload-coroners-letter endpoint in the dev environment
const coronersLetterId = "1c84c788-23c4-49e7-a07e-6b391f09c116";
const coronersLetterFileName = "test_coroners_letter.pdf";
const evidenceFileId = "2f76cf9d-a90f-4f9c-8f27-bf22312c7138";
const evidenceFileName = "test-evidence.pdf";

// Sentinel claim evidence id used in E2E tests to trigger a 404 from the
// claim evidence download endpoint.
const NOT_FOUND_EVIDENCE_ID = "00000000-0000-0000-0000-000000000404";

// As a temporary measure, until we stop using mocks for e2e tests, this is used to populate the database
const bypassCreateApplicationMocks =
  process.env.PLAYWRIGHT_BYPASS_CREATE_APPLICATION_MOCKS === "true";

// Sentinel laaReference used in E2E tests to trigger a 422 response from the claim submit endpoint.
// The GET search handler returns a mock case with this numeric laaReference when the search term is "force-422".
const FORCE_422_LAA_REFERENCE = "422";
const FORCE_REJECTED_LAA_REFERENCE = "299";

export const apiHandlers = [
  http.get("*/applications/public-bodies", () =>
    HttpResponse.json([
      {
        publicBodyId: "DEPARTMENT_FOR_TRANSPORT",
        publicBodyDescription: "Department for Transport",
      },
      {
        publicBodyId: "MINISTRY_OF_JUSTICE",
        publicBodyDescription: "Ministry of Justice",
      },
      {
        publicBodyId: "MINISTRY_OF_DEFENCE",
        publicBodyDescription: "Ministry of Defence",
      },
    ]),
  ),
  http.get("*/applications/search", ({ request }) => {
    const url = new URL(request.url);
    const laaReference = url.searchParams.get("laa_reference");

    if (laaReference === "force-ineligible") {
      return HttpResponse.json([]);
    }

    if (laaReference === "force-rejected") {
      return HttpResponse.json([
        {
          laaReference: 299,
          clientFirstName: "Force",
          clientLastName: "Rejected",
          clientDateOfBirth: "01/01/2000",
          dateSubmitted: "2026-01-01T00:00:00",
          firmName: "Test Firm",
          firmNumber: "123",
          overallDecision: "GRANTED",
        },
      ]);
    }

    if (laaReference === "force-422") {
      return HttpResponse.json([
        {
          laaReference: 422,
          clientFirstName: "Force",
          clientLastName: "422",
          clientDateOfBirth: "01/01/2000",
          dateSubmitted: "2026-01-01T00:00:00",
          firmName: "Test Firm",
          firmNumber: "123",
          overallDecision: "GRANTED",
        },
      ]);
    }

    if (laaReference === "1") {
      return HttpResponse.json([
        {
          laaReference: 1,
          clientFirstName: "Seed",
          clientLastName: "Provider",
          clientDateOfBirth: "01-01-1990",
          dateSubmitted: "2026-08-06T13:41:38.089Z",
          firmName: "Seed",
          firmNumber: "Seed",
          overallDecision: "GRANTED",
        },
      ]);
    }

    return HttpResponse.json([]);
  }),
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
  http.post(`${process.env.INQUESTS_API_URL}/claims/evidence`, () =>
    HttpResponse.json(
      {
        claimEvidenceId: evidenceFileId,
        claimEvidenceFileName: evidenceFileName,
      },
      { status: 201 },
    ),
  ),
  http.delete(
    `${process.env.INQUESTS_API_URL}/claims/:claimEvidenceId`,
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.get(
    `${process.env.INQUESTS_API_URL}/claims/:evidenceId`,
    ({ request, params }) => {
      const { evidenceId } = params;

      if (evidenceId === NOT_FOUND_EVIDENCE_ID) {
        return new HttpResponse(null, { status: 404 });
      }

      const url = new URL(request.url);
      const disposition =
        url.searchParams.get("disposition") === "inline"
          ? "inline"
          : "attachment";

      return new HttpResponse("mock evidence file content", {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${disposition}; filename="${evidenceFileName}"`,
        },
      });
    },
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
  http.post("*/applications/*/claim", async ({ request }) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const laaReference = pathParts[pathParts.indexOf("applications") + 1];
    const body = (await request.json()) as { claimEvidenceIds?: unknown };

    if (
      !Array.isArray(body.claimEvidenceIds) ||
      body.claimEvidenceIds.length === 0
    ) {
      return HttpResponse.json(
        { errorCode: "MISSING_CLAIM_EVIDENCE" },
        { status: 422 },
      );
    }

    if (laaReference === FORCE_422_LAA_REFERENCE) {
      return HttpResponse.json(
        { errorCode: "NET_TOTAL_HIGHER_THAN_GROSS_TOTAL" },
        { status: 422 },
      );
    }

    if (laaReference === FORCE_REJECTED_LAA_REFERENCE) {
      return HttpResponse.json(
        {
          claimId: 42,
          laaReference: 299,
          claimTypeId: "PAYMENT_ON_ACCOUNT",
          statusId: "REJECTED",
          submissionDate: "2026-07-07T12:25:08.407881",
          totalProfitCostNet: 1000,
          totalProfitCostGross: 1200,
          claimantId: "test@example.com",
          poaTypeId: "PROFIT_COST",
          rejectionReasons: [
            "MAX_POA_CLAIMS_EXCEEDED",
            "CLAIM_EXCEEDS_SUBSTANTIVE_COST_LIMIT",
            "UNLISTED_REJECTION_REASON_CODE",
          ],
        },
        { status: 201 },
      );
    }

    return HttpResponse.json(
      {
        claimId: 42,
        laaReference: 1,
        claimTypeId: "PAYMENT_ON_ACCOUNT",
        statusId: "SUBMITTED",
        submissionDate: "2026-07-07T12:25:08.407881",
        totalProfitCostNet: 1000,
        totalProfitCostGross: 1200,
        claimantId: "test@example.com",
        poaTypeId: "PROFIT_COST",
      },
      { status: 201 },
    );
  }),
];
