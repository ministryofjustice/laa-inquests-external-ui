import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  CaseSearchError,
  CaseSearchFormData,
  CaseSearchValidator,
} from "./CaseSearch.validator.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";
import type { SearchCasesPort } from "#src/ports/source/inquests-api/SearchCases.port.js";
import type { ListClaimsPort } from "#src/ports/source/inquests-api/ListClaims.port.js";
import { CaseSearchFormatter } from "./CaseSearch.formatter.js";
import { SearchCasesUseCase } from "#src/use-cases/claim/SearchCases.useCase.js";
import { SelectCaseUseCase } from "#src/use-cases/claim/SelectCase.useCase.js";
import { logger } from "#src/infrastructure/logging/logger.js";

export class CaseSearchAdaptor {
  formValidator: CaseSearchValidator;
  formatter: CaseSearchFormatter;
  searchCasesUseCase: SearchCasesUseCase;
  selectCaseUseCase: SelectCaseUseCase;

  // eslint-disable-next-line @typescript-eslint/max-params -- ideally refactor to bundle ports and use cases in constructor
  constructor(
    formValidator: CaseSearchValidator,
    searchCasesPort: SearchCasesPort,
    listClaimsPort: ListClaimsPort,
    formatter: CaseSearchFormatter = new CaseSearchFormatter(),
    searchCasesUseCase: SearchCasesUseCase = new SearchCasesUseCase(
      searchCasesPort,
    ),
    selectCaseUseCase: SelectCaseUseCase = new SelectCaseUseCase(
      listClaimsPort,
    ),
  ) {
    this.formValidator = formValidator;
    this.formatter = formatter;
    this.searchCasesUseCase = searchCasesUseCase;
    this.selectCaseUseCase = selectCaseUseCase;
  }

  renderForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    req.session.claim = undefined;

    res.render("claim/case-search", {
      csrfToken,
    });
  }

  processForm(
    req: TypedRequestBody<Partial<CaseSearchFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      body: { "case-reference": caseReference },
    } = req;

    const errorSummaries: Partial<CaseSearchError> =
      this.formValidator.validateCaseSearch(req.body);

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      logger.logWarn({
        functionName: "caseSearchAdaptor_processForm",
        message: "Case search form validation failed",
        extraContext: {
          event: "claim_case_search_validation_failed",
          laa_reference: caseReference,
        },
      });
      res.render("claim/case-search", {
        csrfToken,
        caseReference,
        errorSummaries,
      });
    } else {
      req.session.claim = { ...req.session.claim, caseReference };
      res.redirect("/claim/results");
    }
  }

  async renderResults(req: Request, res: Response): Promise<void> {
    const { session } = req;
    const { claim, accessToken } = session;
    const laaReference = claim?.caseReference ?? "";
    const {
      locals: { csrfToken },
    } = res;

    const cases = await this.searchCasesUseCase.execute(
      laaReference,
      accessToken,
      "GRANTED",
    );

    session.claim = {
      ...session.claim,
      searchResults: this.formatter.formatClientDetails(cases),
    };

    res.render("claim/case-search-results", {
      csrfToken,
      cases: this.formatter.formatCases(cases),
    });
  }

  async selectCase(req: Request, res: Response): Promise<void> {
    const {
      params: { reference },
      session,
    } = req;
    const { claim, accessToken } = session;
    const selectedReference = String(reference);

    const result = await this.selectCaseUseCase.execute(
      selectedReference,
      claim?.searchResults ?? [],
      accessToken,
    );

    if (result.status === "NOT_FOUND") {
      logger.logWarn({
        functionName: "caseSearchAdaptor_selectCase",
        message:
          "Case selection failed because reference was not in cached results",
        request: req,
        extraContext: {
          event: "claim_case_selection_failed",
          reason: "INVALID_INPUT_STATE",
        },
      });
      res.redirect("/claim/results");
    } else if (result.status === "BLOCKED") {
      session.claim = {
        ...claim,
        caseReference: selectedReference,
        client: result.client,
        claimBlocked: true,
      };
      logger.logInfo({
        functionName: "caseSearchAdaptor_selectCase",
        message: "Claim submission blocked by an active final or nil bill",
        request: req,
        extraContext: {
          event: "claim_blocked",
          laa_reference: selectedReference,
        },
      });
      res.redirect("/claim/cannot-claim");
    } else {
      session.claim = {
        ...claim,
        caseReference: selectedReference,
        client: result.client,
      };
      res.redirect("/claim/type");
    }
  }
}
