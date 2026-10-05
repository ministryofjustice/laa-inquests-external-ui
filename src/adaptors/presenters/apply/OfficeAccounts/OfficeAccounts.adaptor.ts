import type { Request, Response } from "express";
import type { GetProviderOfficesPort } from "#src/ports/source/inquests-api/GetProviderOffices.port.js";
import { GetProviderOfficesUseCase } from "#src/use-cases/apply/providerOffices/GetProviderOffices.useCase.js";
import { ValidateOfficeAccountSelectionUseCase } from "#src/use-cases/apply/providerOffices/ValidateOfficeAccountSelection.useCase.js";
import type { GetProviderOffice } from "#src/adaptors/source/inquests-api/apply/GetProviderOffices/models/GetProviderOffices.types.js";
import type { OfficeAccountsFormData } from "#src/adaptors/presenters/apply/models/form.types.js";
import { logger } from "#src/infrastructure/logging/logger.js";
import { escapeHtml } from "#src/utils/html.js";

interface OfficeAccountsUseCases {
  getProviderOffices: GetProviderOfficesUseCase;
  validateOfficeAccountSelection: ValidateOfficeAccountSelectionUseCase;
}

interface OfficeAccountsOption {
  value: string;
  html: string;
  hint: { text: string };
}

export class OfficeAccountsAdaptor {
  getProviderOfficesUseCase: GetProviderOfficesUseCase;
  validateOfficeAccountSelectionUseCase: ValidateOfficeAccountSelectionUseCase;

  constructor(
    getProviderOfficesPort: GetProviderOfficesPort,
    useCases?: Partial<OfficeAccountsUseCases>,
  ) {
    this.getProviderOfficesUseCase =
      useCases?.getProviderOffices ??
      new GetProviderOfficesUseCase(getProviderOfficesPort);
    this.validateOfficeAccountSelectionUseCase =
      useCases?.validateOfficeAccountSelection ??
      new ValidateOfficeAccountSelectionUseCase();
  }

  async renderOfficeAccountsSelectForm(
    req: Request,
    res: Response,
  ): Promise<void> {
    this.#captureCheckYourAnswersEntry(req);

    const {
      locals: { csrfToken },
    } = res;

    const firmId = this.#resolveFirmId(req);
    const officeOptions = await this.#getOfficeOptions(req, firmId);

    res.render("apply/office-accounts/select-office-account", {
      csrfToken,
      officeOptions,
      selectedOfficeAccount: req.session.selectedOfficeAccount,
    });
  }

  async processOfficeAccountsSelectForm(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { "office-accounts": selectedOffice } =
      req.body as OfficeAccountsFormData;
    const { session } = req;
    const authorisedOffices = await this.#getAuthorisedOffices(
      req,
      this.#resolveFirmId(req),
    );
    const result = this.validateOfficeAccountSelectionUseCase.execute(
      selectedOffice,
      authorisedOffices.map((office) => office.officeCode),
    );

    if (result.status === "VALIDATION_FAILED") {
      const {
        locals: { csrfToken },
      } = res;
      const officeOptions = this.#formatOfficeOptions(
        authorisedOffices,
        req.session.firmName,
      );

      res.render("apply/office-accounts/select-office-account", {
        csrfToken,
        officeOptions,
        errorSummaries: result.errorSummaries,
      });
    } else {
      const selectedOfficeDetails = authorisedOffices.find(
        (office) => office.officeCode === selectedOffice,
      );
      session.selectedOfficeAccount = selectedOffice;
      session.selectedOfficeAddress = this.#formatAddress(
        selectedOfficeDetails!,
      );
      if (req.session.returnToApplyCheckYourAnswers === true) {
        res.redirect("/apply/check-your-answers");
      } else {
        res.redirect("/apply/client-details/name-and-dob");
      }
    }
  }

  #captureCheckYourAnswersEntry(req: {
    query?: Request["query"];
    session: Request["session"];
  }): void {
    if (req.query?.from === "check-your-answers") {
      req.session.returnToApplyCheckYourAnswers = true;
    }
  }

  async #getOfficeOptions(
    req: Request,
    firmId: string,
  ): Promise<OfficeAccountsOption[]> {
    const authorisedOffices = await this.#getAuthorisedOffices(req, firmId);
    return this.#formatOfficeOptions(authorisedOffices, req.session.firmName);
  }

  async #getAuthorisedOffices(
    req: Request,
    firmId: string,
  ): Promise<GetProviderOffice[]> {
    if (firmId === "") {
      return [];
    }

    const providerOffices = await this.getProviderOfficesUseCase.execute(
      firmId,
      req.session.accessToken,
    );

    return this.#filterAuthorisedOffices(req, providerOffices);
  }

  #filterAuthorisedOffices(
    req: Request,
    offices: GetProviderOffice[],
  ): GetProviderOffice[] {
    const {
      session: { userOfficeAccounts },
    } = req;
    if (!Array.isArray(userOfficeAccounts)) {
      logger.logDebug({
        functionName: "officeAccountsAdaptor_filterAuthorisedOffices",
        message: "No userOfficeAccounts found in session; showing no offices",
        extraContext: {
          event: "office_accounts_filter",
          officesReturnedByApi: offices.length,
        },
      });
      return [];
    }
    const authorisedOffices = offices.filter((office) =>
      userOfficeAccounts.includes(office.officeCode),
    );
    logger.logDebug({
      functionName: "officeAccountsAdaptor_filterAuthorisedOffices",
      message: "Filtered provider offices to those the user has access to",
      extraContext: {
        event: "office_accounts_filter",
        officesReturnedByApi: offices.length,
        userOfficeAccountsCount: userOfficeAccounts.length,
        authorisedOfficesCount: authorisedOffices.length,
      },
    });
    return authorisedOffices;
  }

  #formatOfficeOptions(
    offices: GetProviderOffice[],
    firmName?: string,
  ): OfficeAccountsOption[] {
    const firmPrefix =
      typeof firmName === "string" && firmName !== "" ? `${firmName}, ` : "";

    return offices.map((office) => ({
      value: office.officeCode,
      html: `<strong>${escapeHtml(`${firmPrefix}${this.#formatAddress(office)}`)}</strong>`,
      hint: { text: office.officeCode },
    }));
  }

  #formatAddress(office: GetProviderOffice): string {
    const { address } = office;
    return [
      address.addressLine1,
      address.addressLine2,
      address.townOrCity,
      address.county,
      address.postcode,
    ]
      .filter((part): part is string => part !== null && part !== "")
      .join(", ");
  }

  #resolveFirmId(req: Request): string {
    const {
      session: { firmId },
    } = req;
    return typeof firmId === "string" && firmId !== "" ? firmId : "";
  }
}
