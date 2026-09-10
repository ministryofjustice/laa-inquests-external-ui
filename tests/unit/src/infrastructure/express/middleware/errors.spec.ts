import { strict as assert } from "assert";
import sinon from "sinon";
import type { NextFunction, Request, Response } from "express";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { handleServerErrors } from "#src/infrastructure/express/middleware/errors/errors.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";
import {
  ApplicationError,
  APPLICATION_ERROR_TYPES,
} from "#src/use-cases/common/ApplicationError.js";

describe("error middleware", () => {
  let req: StubbedInstance<Request>;
  let res: StubbedInstance<Response>;
  let next: sinon.SinonStub;

  beforeEach(() => {
    req = stubInterface<Request>();
    res = stubInterface<Response>();
    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("handleServerErrors", () => {
    it("logs and renders the fallback 500 page", () => {
      const err = new Error("plain error");
      const logSpy = sinon.spy(logger, "logError");
      res.status.returns(res);
      req.route = { path: "/test-path" } as Request["route"];
      req.method = "POST";

      handleServerErrors(
        err,
        req as unknown as Request,
        res as unknown as Response,
        next as unknown as NextFunction,
      );

      assert.equal(logSpy.callCount, 1);
      assert.deepEqual(logSpy.firstCall.args, [
        {
          functionName: "server_error_middleware",
          message: "Internal Server Error",
          err,
          request: req,
          extraContext: {
            event: "http_request_failed",
            error_type: "UNKNOWN",
            route: "/test-path",
            method: "POST",
            status_code: 500,
          },
        },
      ]);
      assert.equal(res.status.callCount, 1);
      assert.equal(res.status.firstCall.args[0], 500);
      assert.ok(res.status.firstCall.calledBefore(res.render.firstCall));
      assert.equal(res.render.callCount, 1);
      assert.deepEqual(res.render.firstCall.args, [
        "main/error",
        {
          status: 500,
          message: "Internal Server Error",
        },
      ]);
      assert.equal(next.callCount, 0);
    });

    it("includes application error classification in the log", () => {
      const err = new ApplicationError(
        APPLICATION_ERROR_TYPES.UPSTREAM_UNAVAILABLE,
        "get_public_bodies",
        true,
      );
      const logSpy = sinon.spy(logger, "logError");
      res.status.returns(res);
      req.route = { path: "/apply/public-authority" } as Request["route"];
      req.method = "GET";

      handleServerErrors(
        err,
        req as unknown as Request,
        res as unknown as Response,
        next as unknown as NextFunction,
      );

      assert.equal(logSpy.callCount, 1);
      assert.deepEqual(logSpy.firstCall.args[0].extraContext, {
        event: "http_request_failed",
        error_type: "UPSTREAM_UNAVAILABLE",
        operation: "get_public_bodies",
        retryable: true,
        route: "/apply/public-authority",
        method: "GET",
        status_code: 500,
      });
      assert.equal(res.status.firstCall.args[0], 500);
    });
  });
});
