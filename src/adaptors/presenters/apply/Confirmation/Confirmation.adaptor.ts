import type { Request, Response } from "express";
import type { Formatter } from "#src/utils/Formatter.js";
import { CORRESPONDENCE_ADDRESS_SOURCE } from "#src/infrastructure/locales/constants.js";
import type { ApplySubmitPort } from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import type { SessionHelper } from "#src/infrastructure/express/session/sessionHelpers.js";
import type { ClientDeclarationFormData } from "#src/adaptors/presenters/apply/models/form.types.js";
import type { ConfirmationSessionState } from "#src/use-cases/apply/confirmation/models/confirmationSessionState.types.js";
import {
  BuildCheckYourAnswersUseCase,
  type BuildCheckYourAnswersOutput,
} from "#src/use-cases/apply/confirmation/BuildCheckYourAnswers.useCase.js";
import { ConfirmationSessionStateMapper } from "#src/use-cases/apply/confirmation/ConfirmationSessionState.mapper.js";
import { ValidateClientDeclarationUseCase } from "#src/use-cases/apply/confirmation/ValidateClientDeclaration.useCase.js";
import { SubmitApplicationUseCase } from "#src/use-cases/apply/confirmation/SubmitApplication.useCase.js";

interface ConfirmationUseCases {
  buildCheckYourAnswers: BuildCheckYourAnswersUseCase;
  validateClientDeclaration: ValidateClientDeclarationUseCase;
  submitApplication: SubmitApplicationUseCase;
  confirmationSessionStateMapper: ConfirmationSessionStateMapper;
}

export class ConfirmationAdaptor {
  formatter: Formatter;
  sessionHelper: SessionHelper;
  buildCheckYourAnswersUseCase: BuildCheckYourAnswersUseCase;
  validateClientDeclarationUseCase: ValidateClientDeclarationUseCase;
  submitApplicationUseCase: SubmitApplicationUseCase;
  confirmationSessionStateMapper: ConfirmationSessionStateMapper;

  constructor(
    formatter: Formatter,
    applySubmitPort: ApplySubmitPort,
    sessionHelper: SessionHelper,
    useCases?: Partial<ConfirmationUseCases>,
  ) {
    const resolvedUseCases = this.#resolveUseCases(applySubmitPort, useCases);
    const {
      buildCheckYourAnswers,
      validateClientDeclaration,
      submitApplication,
      confirmationSessionStateMapper,
    } = resolvedUseCases;

    this.formatter = formatter;
    this.sessionHelper = sessionHelper;
    this.buildCheckYourAnswersUseCase = buildCheckYourAnswers;
    this.validateClientDeclarationUseCase = validateClientDeclaration;
    this.submitApplicationUseCase = submitApplication;
    this.confirmationSessionStateMapper = confirmationSessionStateMapper;
  }

  #resolveUseCases(
    applySubmitPort: ApplySubmitPort,
    useCases?: Partial<ConfirmationUseCases>,
  ): ConfirmationUseCases {
    const defaultValidateClientDeclarationUseCase =
      new ValidateClientDeclarationUseCase();
    const defaultSubmitApplicationUseCase = new SubmitApplicationUseCase(
      applySubmitPort,
    );
    const defaultUseCases: ConfirmationUseCases = {
      buildCheckYourAnswers: new BuildCheckYourAnswersUseCase(),
      validateClientDeclaration: defaultValidateClientDeclarationUseCase,
      submitApplication: defaultSubmitApplicationUseCase,
      confirmationSessionStateMapper: new ConfirmationSessionStateMapper(),
    };

    if (useCases === undefined) {
      return defaultUseCases;
    }

    const resolvedUseCases: ConfirmationUseCases = {
      ...defaultUseCases,
      ...useCases,
    };

    return resolvedUseCases;
  }

  renderCheckYourAnswers(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const confirmationState = this.#getConfirmationSessionState(req);
    const checkYourAnswersData =
      this.buildCheckYourAnswersUseCase.execute(confirmationState);
    const formattedCheckYourAnswersData =
      this.#toCheckYourAnswersViewModel(checkYourAnswersData);

    res.render("apply/check-your-answers", {
      csrfToken,
      ...formattedCheckYourAnswersData,
    });
  }

  renderClientDeclarationForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/submit/client-declaration", {
      csrfToken,
      clientDetails: {
        firstName: req.session.clientFirstName ?? "",
        lastName: req.session.clientLastName ?? "",
      },
    });
  }

  async processClientDeclarationForm(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { "client-declaration-confirmation": declarationConfirmation } =
      req.body as ClientDeclarationFormData;
    const sessionState = this.#getConfirmationSessionState(req);
    const result = this.validateClientDeclarationUseCase.execute(
      declarationConfirmation,
    );

    if (result.status === "VALIDATION_FAILED") {
      const {
        locals: { csrfToken },
      } = res;

      res.render("apply/submit/client-declaration", {
        csrfToken,
        clientDetails: {
          firstName: req.session.clientFirstName ?? "",
          lastName: req.session.clientLastName ?? "",
        },
        errorSummaries: result.errorSummaries,
      });
      return;
    }

    const { session } = req;
    if (result.status === "SUCCESS") {
      const submitResult =
        await this.submitApplicationUseCase.execute(sessionState);
      if (submitResult.status !== "SUCCESS") {
        return;
      }
      this.sessionHelper.clearApplyFormData(req);
      session.applicationReferenceNumber =
        submitResult.data?.laaReference.toString() ?? "";
      res.redirect("/apply/confirmation/success");
    }
  }

  renderConfirmSuccess(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const applicationReferenceNumber =
      typeof req.session.applicationReferenceNumber === "string"
        ? req.session.applicationReferenceNumber
        : "";

    res.render("apply/confirm-success", {
      csrfToken,
      applicationReferenceNumber,
    });
    this.sessionHelper.clearApplyFormData(req);
  }

  #getConfirmationSessionState(req: Request): ConfirmationSessionState {
    return this.confirmationSessionStateMapper.map(req.session);
  }

  #toCheckYourAnswersViewModel(data: BuildCheckYourAnswersOutput): {
    client: {
      clientFirstName: string;
      clientLastName: string;
      clientDob: string;
      clientAddress: string;
      clientCorrespondenceAddress: string;
      clientCorrespondenceRecipient: string;
    };
    deceasedDetails: {
      deceasedFirstName: string;
      deceasedLastName: string;
      dateOfDeath: string;
      deceasedClientRelationship: string;
      deceasedCoronerReference: string;
    };
    publicAuthorities: ReturnType<Formatter["formatIntoTableRows"]>;
    coronersLetterId: string;
  } {
    const clientAddress = this.#getClientAddressSummary(data);
    const clientPostcode = this.#getClientPostcodeSummary(data);

    return {
      client: {
        clientFirstName: data.client.clientFirstName ?? "",
        clientLastName: data.client.clientLastName ?? "",
        clientDob: this.#createDateString(
          data.client.clientDobDay,
          data.client.clientDobMonth,
          data.client.clientDobYear,
        ),
        clientAddress: `${clientAddress} ${clientPostcode}`,
        clientCorrespondenceAddress:
          this.#getClientCorrespondenceAddressSummary(data),
        clientCorrespondenceRecipient:
          data.client.clientCorrespondenceRecipient?.recipientName ??
          "Correspondence will be addressed to the client",
      },
      deceasedDetails: {
        deceasedFirstName: data.deceasedDetails.deceasedFirstName ?? "",
        deceasedLastName: data.deceasedDetails.deceasedLastName ?? "",
        dateOfDeath: this.#createDateString(
          data.deceasedDetails.dateOfDeathDay,
          data.deceasedDetails.dateOfDeathMonth,
          data.deceasedDetails.dateOfDeathYear,
        ),
        deceasedClientRelationship:
          data.deceasedDetails.deceasedClientRelationship ?? "",
        deceasedCoronerReference:
          data.deceasedDetails.deceasedCoronerReference ?? "",
      },
      publicAuthorities: this.formatter.formatIntoTableRows(
        data.publicAuthorities,
      ),
      coronersLetterId: data.coronersLetterId ?? "",
    };
  }

  #createDateString(day?: string, month?: string, year?: string): string {
    return typeof day === "string" &&
      typeof month === "string" &&
      typeof year === "string"
      ? `${day}/${month}/${year}`
      : "";
  }

  #createAddressString(
    addressLine1?: string,
    addressLine2?: string,
    townOrCity?: string,
    county?: string,
  ): string {
    return `${addressLine1 ?? ""}${addressLine2 ?? " "} ${townOrCity ?? ""} ${county ?? ""}`;
  }

  #getClientAddressSummary(data: BuildCheckYourAnswersOutput): string {
    const { client } = data;
    const { clientHasNoFixedAbode, clientHomeAddress } = client;

    if (clientHasNoFixedAbode === true) {
      return "No fixed abode";
    }

    if (clientHomeAddress === null || clientHomeAddress === undefined) {
      return "";
    }

    return this.#createAddressString(
      clientHomeAddress.addressLine1,
      clientHomeAddress.addressLine2 ?? undefined,
      clientHomeAddress.townOrCity,
      clientHomeAddress.county ?? undefined,
    );
  }

  #getClientPostcodeSummary(data: BuildCheckYourAnswersOutput): string {
    const { client } = data;
    const { clientHasNoFixedAbode, clientHomeAddress } = client;

    if (clientHasNoFixedAbode === true) {
      return "";
    }

    if (clientHomeAddress === null || clientHomeAddress === undefined) {
      return "";
    }

    return clientHomeAddress.postcode;
  }

  #getClientCorrespondenceAddressSummary(
    data: BuildCheckYourAnswersOutput,
  ): string {
    const { client } = data;
    const {
      clientCorrespondenceAddressSource: source,
      clientCorrespondenceAddress: correspondenceAddress,
    } = client;

    if (source === CORRESPONDENCE_ADDRESS_SOURCE.USE_CLIENT_HOME_ADDRESS) {
      return "Same as client's home address";
    }

    if (source === CORRESPONDENCE_ADDRESS_SOURCE.USE_PROVIDER_ADDRESS) {
      return "My office address";
    }

    if (correspondenceAddress === null || correspondenceAddress === undefined) {
      return "";
    }

    const addressString = this.#createAddressString(
      correspondenceAddress.addressLine1,
      correspondenceAddress.addressLine2 ?? undefined,
      correspondenceAddress.townOrCity,
      correspondenceAddress.county ?? undefined,
    );

    return `${addressString} ${correspondenceAddress.postcode}`.trim();
  }
}
