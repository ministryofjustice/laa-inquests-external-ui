import type { ProceedingsAdaptor } from "#src/adaptors/presenters/apply/Proceedings/Proceedings.adaptor.js";
import type { Request, Response, Router } from "express";

export function createProceedingsRouter(
  proceedingsRouter: Router,
  proceedingsAdaptor: ProceedingsAdaptor,
): Router {
  proceedingsRouter.get("/proceedings", (req: Request, res: Response): void => {
    proceedingsAdaptor.renderProceedingSelectForm(req, res);
  });

  proceedingsRouter.post("/proceedings", (req: Request, res: Response) => {
    proceedingsAdaptor.processProceedingsForm(req, res);
  });

  proceedingsRouter.get(
    "/proceedings/confirmation",
    (req: Request, res: Response) => {
      proceedingsAdaptor.renderProceedingsConfirmation(req, res);
    },
  );

  proceedingsRouter.post(
    "/proceedings/confirmation",
    (req: Request, res: Response) => {
      proceedingsAdaptor.processProceedingsConfirmation(req, res);
    },
  );

  return proceedingsRouter;
}
