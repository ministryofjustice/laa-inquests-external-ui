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
import { createClaimTypeRouter } from "./claim/claimType.router.js";
import { ClaimTypeAdaptor } from "#src/adaptors/presenters/claim/ClaimType/ClaimType.adaptor.js";
import { ClaimTypeValidator } from "#src/adaptors/presenters/claim/ClaimType/ClaimType.validator.js";
import { createConfirmAndSubmitClaimRouter } from "./claim/confirmAndSubmitClaim.router.js";
import { ConfirmAndSubmitAdaptor } from "#src/adaptors/presenters/claim/ConfirmAndSubmit/ConfirmAndSubmit.adaptor.js";
import { SubmitClaimAdaptor } from "#src/adaptors/source/inquests-api/claim/SubmitClaim/SubmitClaim.adaptor.js";
import { createTotalClaimRouter } from "./claim/totalClaim.router.js";
import { TotalClaimAdaptor } from "#src/adaptors/presenters/claim/TotalClaim/TotalClaim.adaptor.js";
import { createEvidenceRouter } from "./claim/evidence.router.js";
import { EvidenceAdaptor } from "#src/adaptors/presenters/claim/Evidence/Evidence.adaptor.js";
import { createAuthRouter } from "./auth.router.js";
import { AuthAdaptor } from "#src/adaptors/presenters/auth/Auth.adaptor.js";
import { EntraAuthAdaptor } from "#src/adaptors/source/auth/EntraAuth.adaptor.js";
import { createCoronersLetterRouter } from "./apply/coronersLetter.router.js";
import { CoronersLetterAdaptor } from "#src/adaptors/presenters/apply/CoronersLetter/CoronersLetter.adaptor.js";
import { UploadCoronersLetterAdaptor } from "#src/adaptors/source/inquests-api/apply/UploadCoronersLetter/UploadCoronersLetterAdaptor.js";
import { ConfidentialClientApplication } from "@azure/msal-node";
import axios from "axios";

import config from "#src/infrastructure/config/config.js";
import { SessionHelper } from "../session/sessionHelpers.js";
import { HomeAdaptor } from "#src/adaptors/presenters/home/Home.adaptor.js";
import { requireAuth } from "../middleware/auth/requireAuth.js";
import { appInfo } from "#src/infrastructure/express/middleware/logger.js";
import { UploadCoronersLetterValidator } from "#src/adaptors/presenters/apply/CoronersLetter/CoronersLetter.validator.js";
import { UploadCoronersLetterUseCase } from "#src/use-cases/apply/coronersLetter/UploadCoronersLetter.useCase.js";
import { createErrorRouter } from "./error.router.js";

const DEV_AUTH_BYPASS_MODULE_PATH =
  "#public/src/infrastructure/express/middleware/auth/devAuthBypass.js";
const TEST_SEED_ROUTER_MODULE_PATH =
  "#public/src/infrastructure/express/routes/test/seedApplication.router.js";
const TEST_SEED_ADAPTOR_MODULE_PATH =
  "#public/src/adaptors/presenters/test/SeedApplication/SeedApplication.adaptor.js";

// Create a new router
const indexRouter = express.Router();
const clientDetailsRouter = express.Router();
const caseSearchRouter = express.Router();
const deceasedDetailsRouter = express.Router();
const proceedingsRouter = express.Router();
const confirmationRouter = express.Router();
const publicAuthorityRouter = express.Router();
const coronersLetterRouter = express.Router();
const claimTypeRouter = express.Router();
const confirmAndSubmitClaimRouter = express.Router();
const totalClaimRouter = express.Router();
const evidenceRouter = express.Router();
const errorRouter = express.Router();

const SUCCESSFUL_REQUEST = 200;

function createAuthSource(): EntraAuthAdaptor {
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
  config.AUTH_SCOPES,
);

indexRouter.use("/auth", createAuthRouter(express.Router(), authAdaptor));

// liveness and readiness probes for Helm deployments
indexRouter.get("/status", (req: Request, res: Response): void => {
  res.status(SUCCESSFUL_REQUEST).send("OK");
});

indexRouter.get("/health", (req: Request, res: Response): void => {
  res.status(SUCCESSFUL_REQUEST).send("Healthy");
});

indexRouter.use("/", createErrorRouter(errorRouter));

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

const uploadCoronersLetterSource = new UploadCoronersLetterAdaptor(
  axios.create(),
  config.INQUESTS_API_URL,
);
const uploadCoronersLetterUseCase = new UploadCoronersLetterUseCase(
  uploadCoronersLetterSource,
);
const uploadCoronersLetterValidator = new UploadCoronersLetterValidator();
const coronersLetterAdaptor = new CoronersLetterAdaptor(
  uploadCoronersLetterValidator,
  uploadCoronersLetterUseCase,
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

const claimTypeValidator = new ClaimTypeValidator();
const claimTypeAdaptor = new ClaimTypeAdaptor(claimTypeValidator);

const submitClaimSource = new SubmitClaimAdaptor(
  axios.create(),
  config.INQUESTS_API_URL,
);
const confirmAndSubmitFormatter = new Formatter();
const confirmAndSubmitAdaptor = new ConfirmAndSubmitAdaptor(
  confirmAndSubmitFormatter,
  submitClaimSource,
);

const totalClaimAdaptor = new TotalClaimAdaptor();

const evidenceAdaptor = new EvidenceAdaptor();

indexRouter.use(
  "/claim",
  createCaseSearchRouter(caseSearchRouter, caseSearchAdaptor),
  createClaimTypeRouter(claimTypeRouter, claimTypeAdaptor),
  createTotalClaimRouter(totalClaimRouter, totalClaimAdaptor),
  createEvidenceRouter(evidenceRouter, evidenceAdaptor),
  createConfirmAndSubmitClaimRouter(
    confirmAndSubmitClaimRouter,
    confirmAndSubmitAdaptor,
  ),
);

indexRouter.use(
  "/apply",
  createClientDetailsRouter(clientDetailsRouter, clientDetailsAdaptor),
  createProceedingsRouter(proceedingsRouter, proceedingsAdaptor),
  createDeceasedDetailsRouter(deceasedDetailsRouter, deceasedDetailsAdaptor),
  createConfirmationRouter(confirmationRouter, confirmationAdaptor),
  createPublicAuthorityRouter(publicAuthorityRouter, publicAuthorityAdaptor),
  createCoronersLetterRouter(coronersLetterRouter, coronersLetterAdaptor),
);

if (process.env.NODE_ENV === "test") {
  const { createSeedApplicationRouter } = (await import(
    TEST_SEED_ROUTER_MODULE_PATH
  )) as {
    createSeedApplicationRouter: (
      seedApplicationRouter: express.Router,
      seedApplicationAdaptor: unknown,
    ) => express.Router;
  };
  const { SeedApplicationAdaptor } = (await import(
    TEST_SEED_ADAPTOR_MODULE_PATH
  )) as {
    SeedApplicationAdaptor: new (
      submitApplicationSource: SubmitApplicationAdaptor,
      uploadCoronersLetterSource: UploadCoronersLetterAdaptor,
    ) => {
      seedApplication: (req: Request, res: Response) => Promise<void>;
    };
  };

  const seedApplicationRouter = express.Router();

  const seedApplicationAdaptor = new SeedApplicationAdaptor(
    submitApplicationSource,
    uploadCoronersLetterSource,
  );

  indexRouter.use(
    "/test/seed",
    createSeedApplicationRouter(seedApplicationRouter, seedApplicationAdaptor),
  );
}

export default indexRouter;
