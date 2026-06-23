/**
 * API Handlers for MSW
 *
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to external APIs and serve mock responses.
 */

import { http, HttpResponse } from "msw";

export const apiHandlers = [
  http.post("*/applications", async () =>
    HttpResponse.json(
      {
        laaReference: 123,
      },
      { status: 201 },
    ),
  ),
];
