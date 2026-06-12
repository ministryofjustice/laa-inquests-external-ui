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
import { ValidateClientDeclarationUseCase } from "#src/use-cases/apply/confirmation/ValidateClientDeclaration.useCase.js";
import { SubmitApplicationUseCase } from "#src/use-cases/apply/confirmation/SubmitApplication.useCase.js";

interface ConfirmationUseCases {
  buildCheckYourAnswers: BuildCheckYourAnswersUseCase;
  validateClientDeclaration: ValidateClientDeclarationUseCase;
  submitApplication: SubmitApplicationUseCase;
}

export class ConfirmationAdaptor {
  formatter: Formatter;
  sessionHelper: SessionHelper;
  buildCheckYourAnswersUseCase: BuildCheckYourAnswersUseCase;
  validateClientDeclarationUseCase: ValidateClientDeclarationUseCase;
  submitApplicationUseCase: SubmitApplicationUseCase;

  constructor(
    formatter: Formatter,
    applySubmitPort: ApplySubmitPort,
    sessionHelper: SessionHelper,
    useCases?: Partial<ConfirmationUseCases>,
  ) {
    const buildCheckYourAnswersUseCase =
      useCases?.buildCheckYourAnswers ?? new BuildCheckYourAnswersUseCase();
    const validateClientDeclarationUseCase =
      useCases?.validateClientDeclaration ??
      new ValidateClientDeclarationUseCase();
    const submitApplicationUseCase =
      useCases?.submitApplication ??
      new SubmitApplicationUseCase(applySubmitPort);

    this.formatter = formatter;
    this.sessionHelper = sessionHelper;
    this.buildCheckYourAnswersUseCase = buildCheckYourAnswersUseCase;
    this.validateClientDeclarationUseCase = validateClientDeclarationUseCase;
    this.submitApplicationUseCase = submitApplicationUseCase;
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
    const validationResult = this.validateClientDeclarationUseCase.execute(
      declarationConfirmation,
    );

    if (validationResult.status === "VALIDATION_FAILED") {
      const {
        locals: { csrfToken },
      } = res;

      res.render("apply/submit/client-declaration", {
        csrfToken,
        clientDetails: {
          firstName: req.session.clientFirstName ?? "",
          lastName: req.session.clientLastName ?? "",
        },
        errorSummaries: validationResult.errorSummaries,
      });
      return;
    }

    const { session } = req;
    const confirmationState = this.#getConfirmationSessionState(req);
    // COPILOT TODO: There shouldn't be 2 usecase calls within the same presenter call. They should happen together in
    //  the same one
    const submitResult =
      await this.submitApplicationUseCase.execute(confirmationState);

    if (submitResult.status === "SUCCESS") {
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
    const { session } = req;

    return {
      ...this.#getClientState(session),
      ...this.#getDeceasedState(session),
      selectedProceedings: Array.isArray(session.selectedProceedings)
        ? session.selectedProceedings
        : undefined,
      selectedPublicAuthorities: Array.isArray(
        session.selectedPublicAuthorities,
      )
        ? session.selectedPublicAuthorities
        : undefined,
    };
  }

  #getClientState(session: Request["session"]): ConfirmationSessionState {
    // COPILOT TODO: This is a little gross, can we make it feel more understandable. I particularly don't like where the assignment is going over multiple lines
    return {
      clientFirstName: this.#getStringValue(session.clientFirstName),
      clientLastName: this.#getStringValue(session.clientLastName),
      clientLastNameAtBirth:
        typeof session.clientLastNameAtBirth === "string" ||
        session.clientLastNameAtBirth === null
          ? session.clientLastNameAtBirth
          : undefined,
      clientDobDay: this.#getStringValue(session.clientDobDay),
      clientDobMonth: this.#getStringValue(session.clientDobMonth),
      clientDobYear: this.#getStringValue(session.clientDobYear),
      clientNino:
        typeof session.clientNino === "string" || session.clientNino === null
          ? session.clientNino
          : undefined,
      clientHomeAddress: session.clientHomeAddress,
      clientCorrespondenceAddress: session.clientCorrespondenceAddress,
      clientCorrespondenceAddressSource: this.#getStringValue(
        session.clientCorrespondenceAddressSource,
      ) as
        | ConfirmationSessionState["clientCorrespondenceAddressSource"]
        | undefined,
      clientCorrespondenceRecipient:
        (typeof session.clientCorrespondenceRecipient === "object" &&
          session.clientCorrespondenceRecipient !== null) ||
        session.clientCorrespondenceRecipient === null
          ? session.clientCorrespondenceRecipient
          : undefined,
      clientHasNoFixedAbode: session.clientHasNoFixedAbode === true,
    };
  }

  #getDeceasedState(session: Request["session"]): ConfirmationSessionState {
    return {
      deceasedFirstName: this.#getStringValue(session.deceasedFirstName),
      deceasedLastName: this.#getStringValue(session.deceasedLastName),
      deceasedDateOfBirthDay: this.#getStringValue(
        session.deceasedDateOfBirthDay,
      ),
      deceasedDateOfBirthMonth: this.#getStringValue(
        session.deceasedDateOfBirthMonth,
      ),
      deceasedDateOfBirthYear: this.#getStringValue(
        session.deceasedDateOfBirthYear,
      ),
      deceasedDateOfDeathDay: this.#getStringValue(
        session.deceasedDateOfDeathDay,
      ),
      deceasedDateOfDeathMonth: this.#getStringValue(
        session.deceasedDateOfDeathMonth,
      ),
      deceasedDateOfDeathYear: this.#getStringValue(
        session.deceasedDateOfDeathYear,
      ),
      deceasedClientRelationship: this.#getStringValue(
        session.deceasedClientRelationship,
      ),
      deceasedCoronerReference: this.#getStringValue(
        session.deceasedCoronerReference,
      ),
      deceasedFurtherInformation: this.#getStringValue(
        session.deceasedFurtherInformation,
      ),
    };
  }

  #getStringValue(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
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
