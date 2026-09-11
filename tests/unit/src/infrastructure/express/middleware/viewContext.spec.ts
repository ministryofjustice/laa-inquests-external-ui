import { strict as assert } from "assert";
import sinon from "sinon";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { Request, Response, NextFunction } from "express";
import { viewContext } from "#src/infrastructure/express/middleware/accessControl/viewContext.js";
import { APP_ROLES } from "#src/infrastructure/config/accessControl.js";

describe("viewContext", () => {
  let req: StubbedInstance<Request>;
  let res: StubbedInstance<Response>;
  let next: sinon.SinonStub;

  beforeEach(() => {
    req = stubInterface<Request>();
    res = stubInterface<Response>();
    next = sinon.stub();
    req.session = {} as never;
    res.locals = {};
  });

  afterEach(() => {
    sinon.restore();
  });

  const run = (): void => {
    viewContext(
      req as unknown as Request,
      res as unknown as Response,
      next as NextFunction,
    );
  };

  it("exposes an empty userRoles array when the session has no roles", () => {
    run();

    assert.deepEqual(res.locals.userRoles, []);
    assert.equal(next.callCount, 1);
  });

  it("copies the session roles onto res.locals.userRoles", () => {
    req.session.roles = [APP_ROLES.APPLICATION_USER, APP_ROLES.CLAIMS_USER];

    run();

    assert.deepEqual(res.locals.userRoles, [
      APP_ROLES.APPLICATION_USER,
      APP_ROLES.CLAIMS_USER,
    ]);
  });

  it("exposes the role constants for templates", () => {
    run();

    assert.deepEqual(res.locals.appRoles, APP_ROLES);
  });

  describe("hasRole", () => {
    it("returns true for a role the user holds", () => {
      req.session.roles = [APP_ROLES.CLAIMS_USER];

      run();

      const hasRole = res.locals.hasRole as (role: string) => boolean;
      assert.equal(hasRole(APP_ROLES.CLAIMS_USER), true);
    });

    it("returns false for a role the user does not hold", () => {
      req.session.roles = [APP_ROLES.CLAIMS_USER];

      run();

      const hasRole = res.locals.hasRole as (role: string) => boolean;
      assert.equal(hasRole(APP_ROLES.APPLICATION_USER), false);
    });

    it("returns false for every role when the user has none", () => {
      run();

      const hasRole = res.locals.hasRole as (role: string) => boolean;
      assert.equal(hasRole(APP_ROLES.APPLICATION_USER), false);
      assert.equal(hasRole(APP_ROLES.CLAIMS_USER), false);
    });

    it("returns true for each role when the user holds both", () => {
      req.session.roles = [APP_ROLES.APPLICATION_USER, APP_ROLES.CLAIMS_USER];

      run();

      const hasRole = res.locals.hasRole as (role: string) => boolean;
      assert.equal(hasRole(APP_ROLES.APPLICATION_USER), true);
      assert.equal(hasRole(APP_ROLES.CLAIMS_USER), true);
    });
  });
});
