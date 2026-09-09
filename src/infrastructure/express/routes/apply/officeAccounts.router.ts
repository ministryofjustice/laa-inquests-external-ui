import type { Request, Response, Router } from "express";
import type { OfficeAccountsAdaptor } from "#src/adaptors/presenters/apply/OfficeAccounts/OfficeAccounts.adaptor.js";

export function createOfficeAccountsRouter(
  officeAccountsRouter: Router,
  officeAccountsAdaptor: OfficeAccountsAdaptor,
): Router {
  officeAccountsRouter.get(
    "/office-accounts",
    async (req: Request, res: Response): Promise<void> => {
      await officeAccountsAdaptor.renderOfficeAccountsSelectForm(req, res);
    },
  );

  return officeAccountsRouter;
}
