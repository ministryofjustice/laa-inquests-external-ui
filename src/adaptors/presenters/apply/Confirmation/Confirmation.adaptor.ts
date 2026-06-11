import type { Request, Response } from "express";
import type { Formatter } from "#src/utils/Formatter.js";
import type { ApplySubmitPort } from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import type { SessionHelper } from "#src/infrastructure/express/session/sessionHelpers.js";
import type { ClientDeclarationFormData } from "#src/adaptors/presenters/apply/models/form.types.js";
import type { ConfirmationSessionState } from "#src/use-cases/apply/confirmation/models/confirmationSessionState.types.js";
import { BuildCheckYourAnswersUseCase } from "#src/use-cases/apply/confirmation/BuildCheckYourAnswers.useCase.js";
import { ValidateClientDeclarationUseCase } from "#src/use-cases/apply/confirmation/ValidateClientDeclaration.useCase.js";
import { SubmitApplicationUseCase } from "#src/use-cases/apply/confirmation/SubmitApplication.useCase.js";

interface ConfirmationUseCases {
  buildCheckYourAnswers: BuildCheckYourAnswersUseCase;
  validateClientDeclaration: ValidateClientDeclarationUseCase;
  submitApplication: SubmitApplicationUseCase;
}

export class ConfirmationAdaptor {
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
      useCases?.buildCheckYourAnswers ??
      new BuildCheckYourAnswersUseCase(formatter);
    const validateClientDeclarationUseCase =
      useCases?.validateClientDeclaration ??
      new ValidateClientDeclarationUseCase();
    const submitApplicationUseCase =
      useCases?.submitApplication ??
      new SubmitApplicationUseCase(applySubmitPort);

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

    res.render("apply/check-your-answers", {
      csrfToken,
      ...checkYourAnswersData,
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
}
