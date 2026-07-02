import { strict as assert } from "assert";
import sinon from "sinon";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { Request, Response, NextFunction } from "express";
import { seedDevAuthSession } from "#src/infrastructure/express/middleware/auth/devAuthBypass.js";

describe("seedDevAuthSession", () => {
  let req: StubbedInstance<Request>;
  let res: StubbedInstance<Response>;
  let next: sinon.SinonStub;

  beforeEach(() => {
    req = stubInterface<Request>();
    res = stubInterface<Response>();
    next = sinon.stub();
    req.session = {} as any;
    res.locals = {};
  });

  afterEach(() => {
    sinon.restore();
  });

  it("seeds an authenticated user when session has no userId", () => {
    seedDevAuthSession(req, res, next as NextFunction);

    assert.equal(req.session.userId, "dev-user-id");
    assert.deepEqual(req.session.user, { name: "Developer User" });
    assert.equal(req.session.firmCode, "0A123B");
    assert.equal(req.session.officeId, "001");
    assert.equal(req.session.providerEmail, "developer@example.com");
    assert.equal(req.session.accessToken, "dev-access-token");
    assert.equal(res.locals.userName, "Developer User");
    assert.equal(next.callCount, 1);
  });

  it("does not overwrite an existing authenticated session", () => {
    req.session.userId = "existing-user-id";
    req.session.user = { name: "Existing User" };

    seedDevAuthSession(req, res, next as NextFunction);

    assert.equal(req.session.userId, "existing-user-id");
    assert.deepEqual(req.session.user, { name: "Existing User" });
    assert.equal(next.callCount, 1);
  });
});
