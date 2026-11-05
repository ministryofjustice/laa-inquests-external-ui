import { strict as assert } from "assert";
import type { Request, Response } from "express";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { getRequestContext } from "#src/infrastructure/logging/requestContext.js";
import { requestContextMiddleware } from "#src/infrastructure/logging/requestContextMiddleware.js";

describe("requestContextMiddleware", () => {
  let request: StubbedInstance<Request>;
  let response: StubbedInstance<Response>;

  beforeEach(() => {
    request = stubInterface<Request>();
    response = stubInterface<Response>();
  });

  it("sets response headers for generated request IDs", () => {
    let requestContext = getRequestContext();

    request.headers = {};
    requestContextMiddleware(request, response, () => {
      requestContext = getRequestContext();
    });

    assert(requestContext !== undefined);
    assert.equal(
      response.setHeader.calledWith("x-request-id", requestContext.requestId),
      true,
    );
    assert.equal(
      response.setHeader.calledWith(
        "x-correlation-id",
        requestContext.correlationId,
      ),
      true,
    );
    assert.equal(requestContext.correlationId, requestContext.requestId);
  });

  it("keeps incoming ID header values in the response", () => {
    request.headers = {
      "x-request-id": "incoming-request",
      "x-correlation-id": "incoming-correlation",
    };

    requestContextMiddleware(request, response, () => {
      assert.deepEqual(getRequestContext(), {
        requestId: "incoming-request",
        correlationId: "incoming-correlation",
      });
    });

    assert.equal(
      response.setHeader.calledWith("x-request-id", "incoming-request"),
      true,
    );
    assert.equal(
      response.setHeader.calledWith("x-correlation-id", "incoming-correlation"),
      true,
    );
  });
});
