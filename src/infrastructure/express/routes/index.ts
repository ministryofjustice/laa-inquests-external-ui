import express from "express";
import type { Request, Response } from "express";
import axios from "axios";
import createApplicationRouter from "#src/infrastructure/express/routes/application.router.js";
import { createClientDetailsRouter } from "./apply/clientDetails.router.js";
import { ClientDetailsAdaptor } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.js";
import { ApplicationInquestsApiAdaptor } from "#src/adaptors/source/InquestsApi/application.adaptor.js";
import { ApplicationDisplayAdaptor } from "#src/adaptors/presenters/application.js";
// Create a new router
const indexRouter = express.Router();
const clientDetailsRouter = express.Router();
const SUCCESSFUL_REQUEST = 200;
const UNSUCCESSFUL_REQUEST = 500;

/* GET home page. */
indexRouter.get("/", (req: Request, res: Response): void => {
  res.render("main/index");
});

indexRouter.get("/apply", (req: Request, res: Response): void => {
  res.render("apply/declaration");
});

// liveness and readiness probes for Helm deployments
indexRouter.get("/status", (req: Request, res: Response): void => {
  res.status(SUCCESSFUL_REQUEST).send("OK");
});

indexRouter.get("/health", (req: Request, res: Response): void => {
  res.status(SUCCESSFUL_REQUEST).send("Healthy");
});

indexRouter.get("/error", (req: Request, res: Response): void => {
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

indexRouter.use("/applications", [
  createApplicationRouter(express.Router(), applicationDisplayAdaptor),
]);

const clientDetailsAdaptor = new ClientDetailsAdaptor();
indexRouter.use(
  "/apply",
  createClientDetailsRouter(clientDetailsRouter, clientDetailsAdaptor),
);

export default indexRouter;
