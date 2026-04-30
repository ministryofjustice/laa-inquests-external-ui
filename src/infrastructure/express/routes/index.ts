import express from "express";
import type { Request, Response } from "express";

import createApplicationRouter from "#src/infrastructure/express/routes/application.router.js";
import { ApplicationDisplayAdaptor } from "#src/adaptors/presenters/application.js";
import { ApplicationInquestsApiAdaptor } from "#src/adaptors/source/InquestsApi/application.adaptor.js";
import axios from "axios";

// Create a new router
const router = express.Router();
const SUCCESSFUL_REQUEST = 200;
const UNSUCCESSFUL_REQUEST = 500;

/* GET home page. */
router.get("/", (req: Request, res: Response): void => {
  res.render("main/index");
});

router.get("/apply", (req: Request, res: Response): void => {
  res.render("apply/declaration");
});

router.get(
  "/apply/basic-client-details",
  (req: Request, res: Response): void => {
    res.render("apply/client-details/basic-details");
  },
);

// liveness and readiness probes for Helm deployments
router.get("/status", (req: Request, res: Response): void => {
  res.status(SUCCESSFUL_REQUEST).send("OK");
});

router.get("/health", (req: Request, res: Response): void => {
  res.status(SUCCESSFUL_REQUEST).send("Healthy");
});

router.get("/error", (req: Request, res: Response): void => {
  // Simulate an error
  res
    .set("X-Error-Tag", "TEST_500_ALERT")
    .status(UNSUCCESSFUL_REQUEST)
    .send("Internal Server Error");
});

const applicationInquestsApiAdaptor = new ApplicationInquestsApiAdaptor(
  axios,
  "https://laa-inquests-api-uat.apps.live.cloud-platform.service.justice.gov.uk",
);
const applicationDisplayAdaptor = new ApplicationDisplayAdaptor(
  applicationInquestsApiAdaptor,
);

router.use("/applications", [
  createApplicationRouter(express.Router(), applicationDisplayAdaptor),
]);

export default router;
