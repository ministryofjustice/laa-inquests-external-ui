/**
 * API Handlers for MSW
 *
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to external APIs and serve mock responses.
 */

import { http, HttpResponse } from "msw";

//TODO: This UUID will have to be updated to one which exists in the database when we deploy the API
const coronersLetterId = "fe0f1337-ca80-4a5c-bc58-c2d85d67f86f";

export const apiHandlers = [
  http.post(
    `${process.env.INQUESTS_API_URL}/applications/upload-coroners-letter`,
    () =>
      HttpResponse.json(
        { coronersLetterId: coronersLetterId },
        { status: 201 },
      ),
  ),
];
