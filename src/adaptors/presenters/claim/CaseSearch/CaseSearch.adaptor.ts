import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  CaseSearchError,
  CaseSearchFormData,
  CaseSearchValidator,
} from "./CaseSearch.validator.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";
import type { SearchCasesPort } from "#src/ports/source/inquests-api/SearchCases.port.js";
import { CaseSearchFormatter } from "./CaseSearch.formatter.js";
import { SearchCasesUseCase } from "#src/use-cases/claim/SearchCases.useCase.js";

export class CaseSearchAdaptor {
  formValidator: CaseSearchValidator;
  formatter: CaseSearchFormatter;
  searchCasesUseCase: SearchCasesUseCase;

  constructor(
    formValidator: CaseSearchValidator,
    searchCasesPort: SearchCasesPort,
    formatter: CaseSearchFormatter = new CaseSearchFormatter(),
    searchCasesUseCase?: SearchCasesUseCase,
  ) {
    this.formValidator = formValidator;
    this.formatter = formatter;
    this.searchCasesUseCase =
      searchCasesUseCase ?? new SearchCasesUseCase(searchCasesPort);
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
      res.render("claim/case-search", {
        csrfToken,
        caseReference,
        errorSummaries,
      });
      return;
    }

    req.session.claim = { ...req.session.claim, caseReference };
    res.redirect("/claim/results");
  }

  async renderResults(req: Request, res: Response): Promise<void> {
    const { session } = req;
    const { claim, accessToken } = session;
    const laaReference = claim?.caseReference ?? "";
    const {
      locals: { csrfToken },
    } = res;

    const result = await this.searchCasesUseCase.execute(
      laaReference,
      accessToken,
    );

    if (result.status !== "SUCCESS") {
      return;
    }

    const cases = result.data ?? [];
    const eligibleCases = cases.filter((c) =>
      this.#isEligibleForClaim(c.overallDecision),
    );
    session.claim = {
      ...session.claim,
      searchResults: this.formatter.formatClientDetails(eligibleCases),
    };

    res.render("claim/case-search-results", {
      csrfToken,
      cases: this.formatter.formatCases(eligibleCases),
    });
  }

  selectCase(req: Request, res: Response): void {
    const {
      params: { reference },
      session: { claim },
    } = req;
    const selectedReference = String(reference);

    const selectedClient = (claim?.searchResults ?? []).find(
      (c) => c.reference === selectedReference,
    );

    if (selectedClient === undefined) {
      res.redirect("/claim/results");
      return;
    }

    req.session.claim = {
      ...claim,
      caseReference: selectedReference,
      client: selectedClient,
    };

    res.redirect("/claim/type");
  }

  #isEligibleForClaim(overallDecision: string): boolean {
    return overallDecision.trim().toUpperCase() === "GRANTED";
  }
}
