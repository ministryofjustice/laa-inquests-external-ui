import express from "express";
import type { Request, Response } from "express";
import axios from "axios";
import createApplicationRouter from "#src/infrastructure/express/routes/application.router.js";
import { createClientDetailsRouter } from "#src/infrastructure/express/routes/apply/clientDetails.router.js";
import { ClientDetailsAdaptor } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.js";
import { createConfirmationRouter } from "./apply/confirmation.router.js";
import { createDeceasedDetailsRouter } from "./apply/deceasedDetails.router.js";
import { ClientDetailsValidator } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.validator.js";
import { ConfirmationAdaptor } from "#src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.js";
import { DeceasedDetailsAdaptor } from "#src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.js";
import { DeceasedDetailsValidator } from "#src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.validator.js";
import { ProceedingsAdaptor } from "#src/adaptors/presenters/apply/Proceedings/Proceedings.adaptor.js";
import { createProceedingsRouter } from "./apply/proceedings.router.js";
import { ProceedingsValidator } from "#src/adaptors/presenters/apply/Proceedings/Proceedings.validator.js";
import { SubmitAdaptor } from "#src/adaptors/presenters/apply/Submit/Submit.adaptor.js";
import { Formatter } from "#src/utils/Formatter.js";
import { PublicAuthorityAdaptor } from "#src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.js";
import { PublicAuthorityValidator } from "#src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.validator.js";
import { createPublicAuthorityRouter } from "./apply/publicAuthority.router.js";
import { createSubmitRouter } from "./apply/submit.router.js";
import { SubmitApplicationDomain } from "#src/adaptors/source/inquests-api/submit-application.adaptor.js";

// Create a new router
const indexRouter = express.Router();
const clientDetailsRouter = express.Router();
const deceasedDetailsRouter = express.Router();
const proceedingsRouter = express.Router();
const submitRouter = express.Router();
const confirmationRouter = express.Router();
const publicAuthorityRouter = express.Router();

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

const clientDetailsFormValidator = new ClientDetailsValidator();
const clientDetailsAdaptor = new ClientDetailsAdaptor(
  clientDetailsFormValidator,
);

const deceasedDetailsFormValidator = new DeceasedDetailsValidator();
const deceasedDetailsAdaptor = new DeceasedDetailsAdaptor(
  deceasedDetailsFormValidator,
);

const proceedingsFormatter = new Formatter();
const proceedingsValidator = new ProceedingsValidator();
const proceedingsAdaptor = new ProceedingsAdaptor(
  proceedingsValidator,
  proceedingsFormatter,
);

const confirmationFormatter = new Formatter();
const confirmationAdaptor = new ConfirmationAdaptor(confirmationFormatter);

const publicAuthorityFormatter = new Formatter();
const publicAuthorityValidator = new PublicAuthorityValidator();
const publicAuthorityAdaptor = new PublicAuthorityAdaptor(
  publicAuthorityValidator,
  publicAuthorityFormatter,
);
const submitApplicationDomain = new SubmitApplicationDomain();
const submitAdaptor = new SubmitAdaptor(submitApplicationDomain);

indexRouter.use(
  "/apply",
  createClientDetailsRouter(clientDetailsRouter, clientDetailsAdaptor),
  createProceedingsRouter(proceedingsRouter, proceedingsAdaptor),
  createDeceasedDetailsRouter(deceasedDetailsRouter, deceasedDetailsAdaptor),
  createSubmitRouter(submitRouter, submitAdaptor),
  createConfirmationRouter(confirmationRouter, confirmationAdaptor),
  createPublicAuthorityRouter(publicAuthorityRouter, publicAuthorityAdaptor),
);

export default indexRouter;
