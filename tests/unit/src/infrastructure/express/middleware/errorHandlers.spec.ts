import { strict as assert } from "assert";
import sinon from "sinon";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { NextFunction, Request, Response } from "express";
import {
  handleApplicationError,
  handleBadRequest,
  handleNotFound,
  handleServerError,
  HttpError,
} from "#src/infrastructure/express/middleware/errorHandlers.js";
import { UpstreamHttpError } from "#src/use-cases/common/upstreamHttpError.js";

describe("errorHandlers", () => {
  let req: StubbedInstance<Request>;
  let res: StubbedInstance<Response>;
  let next: sinon.SinonStub;

  beforeEach(() => {
    req = stubInterface<Request>();
    res = stubInterface<Response>();
    next = sinon.stub();
    req.method = "GET";
    req.originalUrl = "/missing";
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("handleNotFound", () => {
    it("renders the shared error view with a 404 status", () => {
      handleNotFound(req, res);

      assert.equal(res.status.callCount, 1);
      assert.equal(res.status.firstCall.args[0], 404);
      assert.equal(res.render.callCount, 1);
      assert.equal(res.render.firstCall.args[0], "main/error");

      const renderModel = res.render.firstCall.args[1] as unknown as Record<
        string,
        unknown
      >;
      assert.equal(renderModel.status, 404);
    });
  });

  describe("handleBadRequest", () => {
    it("renders the shared error view for a 400 HttpError", () => {
      const error = new HttpError(400, "Bad input");

      handleBadRequest(error, req, res, next as NextFunction);

      assert.equal(res.status.callCount, 1);
      assert.equal(res.status.firstCall.args[0], 400);
      assert.equal(next.callCount, 0);
    });

    it("passes through non-400 errors", () => {
      handleBadRequest(new Error("boom"), req, res, next as NextFunction);

      assert.equal(res.status.callCount, 0);
      assert.equal(next.callCount, 1);
    });
  });

  describe("handleApplicationError", () => {
    it("renders the shared error view for an HttpError", () => {
      handleApplicationError(
        new HttpError(404, "missing"),
        req,
        res,
        next as NextFunction,
      );

      assert.equal(res.status.callCount, 1);
      assert.equal(res.status.firstCall.args[0], 404);
      assert.equal(next.callCount, 0);
    });

    it("forwards unknown errors to the next handler", () => {
      handleApplicationError(new Error("boom"), req, res, next as NextFunction);

      assert.equal(next.callCount, 1);
    });

    it("renders the shared error view for an UpstreamHttpError", () => {
      handleApplicationError(
        new UpstreamHttpError(400, "invalid input"),
        req,
        res,
        next as NextFunction,
      );

      assert.equal(res.status.callCount, 1);
      assert.equal(res.status.firstCall.args[0], 400);
      assert.equal(next.callCount, 0);
    });
  });

  describe("handleServerError", () => {
    it("renders the shared error view with a 500 status", () => {
      handleServerError(new Error("boom"), req, res, next as NextFunction);

      assert.equal(res.status.callCount, 1);
      assert.equal(res.status.firstCall.args[0], 500);
      assert.equal(res.render.callCount, 1);
      assert.equal(res.render.firstCall.args[0], "main/error");
    });
  });
});
