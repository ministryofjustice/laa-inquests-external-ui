/**
 * API Handlers for MSW
 *
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to external APIs and serve mock responses.
 */

import { http, HttpResponse } from "msw";

// This is a UUID that exists in the coroners_letter table in the UAT database
// It can be recreated by using the /applications/upload-coroners-letter endpoint in the UAT environment
const coronersLetterId = "1c84c788-23c4-49e7-a07e-6b391f09c116";
const coronersLetterFileName = "test_coroners_letter.pdf";

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
  http.get("*/applications/search", () =>
    HttpResponse.json(
      [
        {
          laaReference: 1,
          clientFirstName: "Jane",
          clientLastName: "Smith",
          clientDateOfBirth: "2000-01-01",
          dateSubmitted: "2026-06-30T15:59:32.622897",
          firmName: "Test Firm",
          firmNumber: "0A123B",
          overallDecision: "GRANTED",
        },
      ],
      { status: 200 },
    ),
  ),
  http.post("*/applications", async () =>
    HttpResponse.json(
      {
        laaReference: 123,
      },
      { status: 201 },
    ),
  ),
];
