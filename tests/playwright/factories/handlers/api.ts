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
];
