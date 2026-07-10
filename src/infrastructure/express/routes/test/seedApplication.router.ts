import type { NextFunction, Request, Response, Router } from "express";
import type { SeedApplicationAdaptor } from "#src/adaptors/presenters/test/SeedApplication/SeedApplication.adaptor.js";

export function createSeedApplicationRouter(
  seedApplicationRouter: Router,
  seedApplicationAdaptor: SeedApplicationAdaptor,
): Router {
  seedApplicationRouter.get(
    "/application",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        await seedApplicationAdaptor.seedApplication(req, res);
      } catch (err: unknown) {
        next(err);
      }
    },
  );

  return seedApplicationRouter;
}
