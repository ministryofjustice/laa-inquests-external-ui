import express from "express";
import type { Request, Response, RequestHandler } from "express";
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
import { Formatter } from "#src/utils/Formatter.js";
import { ClientDetailsFormatter } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.formatter.js";
import { PublicAuthorityAdaptor } from "#src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.js";
import { PublicAuthorityValidator } from "#src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.validator.js";
import { createPublicAuthorityRouter } from "./apply/publicAuthority.router.js";
import { SubmitApplicationAdaptor } from "#src/adaptors/source/inquests-api/apply/SubmitApplication/SubmitApplication.adaptor.js";
import { createCaseSearchRouter } from "./claim/caseSearch.router.js";
import { CaseSearchAdaptor } from "#src/adaptors/presenters/claim/CaseSearch/CaseSearch.adaptor.js";
import { CaseSearchValidator } from "#src/adaptors/presenters/claim/CaseSearch/CaseSearch.validator.js";
import { SearchCasesAdaptor } from "#src/adaptors/source/inquests-api/claim/SearchCases/SearchCases.adaptor.js";
import { createAuthRouter } from "./auth.router.js";
import { AuthAdaptor } from "#src/adaptors/presenters/auth/Auth.adaptor.js";
import { EntraAuthAdaptor } from "#src/adaptors/source/auth/EntraAuth.adaptor.js";
import { MockAuthAdaptor } from "#src/adaptors/source/auth/MockAuth.adaptor.js";
import { ConfidentialClientApplication } from "@azure/msal-node";
import axios from "axios";

import config from "#src/infrastructure/config/config.js";
import { SessionHelper } from "../session/sessionHelpers.js";
import { HomeAdaptor } from "#src/adaptors/presenters/home/Home.adaptor.js";
import { requireAuth } from "../middleware/auth/requireAuth.js";
import createTestRouter from "./test.router.js";
import { appInfo } from "#src/infrastructure/express/middleware/logger.js";

const DEV_AUTH_BYPASS_MODULE_PATH =
  "#public/src/infrastructure/express/middleware/auth/devAuthBypass.js";

// Create a new router
const indexRouter = express.Router();
const clientDetailsRouter = express.Router();
const caseSearchRouter = express.Router();
const deceasedDetailsRouter = express.Router();
const proceedingsRouter = express.Router();
const confirmationRouter = express.Router();
const publicAuthorityRouter = express.Router();

const SUCCESSFUL_REQUEST = 200;
const UNSUCCESSFUL_REQUEST = 500;

function createAuthSource(): EntraAuthAdaptor | MockAuthAdaptor {
  if (process.env.NODE_ENV === "test") {
    return new MockAuthAdaptor(
      config.MOCK_OAUTH_URL ?? "http://localhost:4001",
    );
  }
  const entraClient = new ConfidentialClientApplication({
    auth: {
      clientId: config.AUTH_CLIENT_ID,
      authority: config.AUTH_DIRECTORY_URL,
      clientSecret: config.AUTH_CLIENT_SECRET,
    },
  });
  return new EntraAuthAdaptor(
    entraClient,
    config.AUTH_TOKEN_DEBUG_ENABLED,
    appInfo,
  );
}

const authAdaptor = new AuthAdaptor(
  createAuthSource(),
  config.AUTH_REDIRECT_URI,
  config.AUTH_POST_LOGOUT_URI,
);

indexRouter.use("/auth", createAuthRouter(express.Router(), authAdaptor));

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

if (process.env.NODE_ENV === "test") {
  indexRouter.use("/", createTestRouter(express.Router()));
}

if (process.env.NODE_ENV === "development" && config.app.skipAuthInDev) {
  const { seedDevAuthSession } = (await import(
    DEV_AUTH_BYPASS_MODULE_PATH
  )) as {
    seedDevAuthSession: RequestHandler;
  };
  indexRouter.use(seedDevAuthSession);
}

indexRouter.use(requireAuth);

const homeAdaptor = new HomeAdaptor(new SessionHelper());

/* GET home page. */
indexRouter.get("/", (req: Request, res: Response): void => {
  homeAdaptor.renderHome(req, res);
});

indexRouter.get("/apply", (req: Request, res: Response): void => {
  res.render("apply/declaration");
});

const clientDetailsFormValidator = new ClientDetailsValidator();
const clientDetailsFormatter = new ClientDetailsFormatter();
const clientDetailsAdaptor = new ClientDetailsAdaptor(
  clientDetailsFormValidator,
  clientDetailsFormatter,
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

const publicAuthorityFormatter = new Formatter();
const publicAuthorityValidator = new PublicAuthorityValidator();
const publicAuthorityAdaptor = new PublicAuthorityAdaptor(
  publicAuthorityValidator,
  publicAuthorityFormatter,
);

const submitApplicationSource = new SubmitApplicationAdaptor(
  axios.create(),
  config.INQUESTS_API_URL,
  config.SUBMIT_PAYLOAD_DEBUG_ENABLED,
  appInfo,
);

const confirmationFormatter = new Formatter();
const sessionHelper = new SessionHelper();
const confirmationAdaptor = new ConfirmationAdaptor(
  confirmationFormatter,
  submitApplicationSource,
  sessionHelper,
);

const caseSearchValidator = new CaseSearchValidator();
const searchCasesSource = new SearchCasesAdaptor(
  axios.create(),
  config.INQUESTS_API_URL,
);
const caseSearchAdaptor = new CaseSearchAdaptor(
  caseSearchValidator,
  searchCasesSource,
);

indexRouter.use(
  "/claim",
  createCaseSearchRouter(caseSearchRouter, caseSearchAdaptor),
);

indexRouter.use(
  "/apply",
  createClientDetailsRouter(clientDetailsRouter, clientDetailsAdaptor),
  createProceedingsRouter(proceedingsRouter, proceedingsAdaptor),
  createDeceasedDetailsRouter(deceasedDetailsRouter, deceasedDetailsAdaptor),
  createConfirmationRouter(confirmationRouter, confirmationAdaptor),
  createPublicAuthorityRouter(publicAuthorityRouter, publicAuthorityAdaptor),
);

export default indexRouter;
