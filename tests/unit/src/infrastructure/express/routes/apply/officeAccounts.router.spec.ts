import { strict as assert } from "assert";
import express from "express";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { createOfficeAccountsRouter } from "#src/infrastructure/express/routes/apply/officeAccounts.router.js";
import type { OfficeAccountsAdaptor } from "#src/adaptors/presenters/apply/OfficeAccounts/OfficeAccounts.adaptor.js";

interface RouteLayer {
  route?: {
    path: string;
    stack: { handle: (req: Request, res: Response) => Promise<void> }[];
  };
}

function findRoute(
  router: express.Router,
  path: string,
): RouteLayer["route"] | undefined {
  const stack = (router as unknown as { stack: RouteLayer[] }).stack;
  return stack.find((layer) => layer.route?.path === path)?.route;
}

describe("createOfficeAccountsRouter", () => {
  it("delegates GET /office-accounts to the presenter adaptor", async () => {
    const officeAccountsAdaptor = stubInterface<OfficeAccountsAdaptor>();
    officeAccountsAdaptor.renderOfficeAccountsSelectForm.resolves();

    const router = createOfficeAccountsRouter(
      express.Router(),
      officeAccountsAdaptor,
    );
    const route = findRoute(router, "/office-accounts");

    const req = stubInterface<Request>();
    const res = stubInterface<Response>();

    await route?.stack[0].handle(req, res);

    assert.equal(
      officeAccountsAdaptor.renderOfficeAccountsSelectForm.callCount,
      1,
    );
    assert.equal(
      officeAccountsAdaptor.renderOfficeAccountsSelectForm.firstCall.args[0],
      req,
    );
    assert.equal(
      officeAccountsAdaptor.renderOfficeAccountsSelectForm.firstCall.args[1],
      res,
    );
  });
});
