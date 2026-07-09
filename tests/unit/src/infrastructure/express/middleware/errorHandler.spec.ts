import { strict as assert } from "assert";
import sinon from "sinon";
import type { NextFunction, Request, Response } from "express";
import { stubInterface } from "ts-sinon";
import { errorHandler } from "#src/infrastructure/express/middleware/errorHandler.js";

describe("errorHandler", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    sinon.stub(console, "error");
    req = stubInterface<Request>();
    res = stubInterface<Response>();
    next = sinon.stub() as unknown as NextFunction;

    res.status = sinon.stub().returns(res);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("renders main/internal-server-error with status 500 when an error is thrown", () => {
    const err = new Error("Something went wrong");

    errorHandler(err, req, res, next);

    assert.equal((res.status as sinon.SinonStub).calledWith(500), true);
    assert.equal(
      (res.render as sinon.SinonStub).calledWith("main/internal-server-error"),
      true,
    );
  });

  it("logs the error message via devError", () => {
    const err = new Error("Test");

    errorHandler(err, req, res, next);

    assert.equal(
      (console.error as sinon.SinonStub).calledWithMatch("Test"),
      true,
    );
  });
});
