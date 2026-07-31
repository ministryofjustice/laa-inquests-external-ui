import type { Request, Response } from "express";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  PublicAuthorityValidator,
  PublicAuthorityFormData,
} from "./PublicAuthority.validator.js";
import type { Formatter } from "#src/utils/Formatter.js";
import type { GetPublicAuthoritiesPort } from "#src/ports/source/inquests-api/GetPublicAuthorities.port.js";
import { GetPublicAuthoritiesUseCase } from "#src/use-cases/apply/publicAuthority/GetPublicAuthorities.useCase.js";
import type { PublicAuthority } from "#src/infrastructure/express/session/index.types.js";
import type { GetPublicAuthoritiesResponse } from "#src/adaptors/source/inquests-api/apply/GetPublicAuthorities/models/GetPublicAuthorities.types.js";

interface PublicAuthorityUseCases {
  getPublicAuthorities: GetPublicAuthoritiesUseCase;
}

export class PublicAuthorityAdaptor {
  formValidator: PublicAuthorityValidator;
  formatter: Formatter;
  getPublicAuthoritiesUseCase: GetPublicAuthoritiesUseCase;

  constructor(
    formValidator: PublicAuthorityValidator,
    formatter: Formatter,
    getPublicAuthoritiesPort: GetPublicAuthoritiesPort,
    useCases?: Partial<PublicAuthorityUseCases>,
  ) {
    this.formValidator = formValidator;
    this.formatter = formatter;
    this.getPublicAuthoritiesUseCase =
      useCases?.getPublicAuthorities ??
      new GetPublicAuthoritiesUseCase(getPublicAuthoritiesPort);
  }

  async renderPublicAuthoritySelectForm(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { session } = req;
    const {
      locals: { csrfToken },
    } = res;

    const getPublicAuthoritiesResult =
      await this.getPublicAuthoritiesUseCase.execute(session.accessToken);

    if (
      getPublicAuthoritiesResult.status !== "SUCCESS" ||
      getPublicAuthoritiesResult.data === undefined
    ) {
      throw new Error(
        getPublicAuthoritiesResult.status === "TECHNICAL_FAILURE"
          ? getPublicAuthoritiesResult.reason
          : "UNEXPECTED_FAILURE",
      );
    }

    const publicAuthorityOptions = this.#mapPublicBodiesToPublicAuthorities(
      getPublicAuthoritiesResult.data,
    );

    session.availablePublicAuthorities = publicAuthorityOptions;

    const selectedPublicAuthorityIds =
      session.selectedPublicAuthorities?.map(
        (auth) => auth.publicAuthorityId,
      ) ?? [];

    res.render("apply/public-authority/add-public-authority", {
      csrfToken,
      publicAuthorityOptions:
        this.formatter.formatPublicAuthorityOptionsIntoList(
          publicAuthorityOptions,
        ),
      selectedPublicAuthorityIds,
    });
  }

  async processPublicAuthorityForm(
    req: TypedRequestBody<PublicAuthorityFormData>,
    res: Response,
  ): Promise<void> {
    const { session } = req;
    const {
      locals: { csrfToken },
    } = res;

    const {
      body: { publicAuthorityOption },
    } = req;

    const availablePublicAuthorities =
      await this.#getAvailablePublicAuthorities(req.session);

    const errors = this.formValidator.validatePublicAuthorityInput(req.body);

    const selectedPublicAuthorityIds = Array.isArray(publicAuthorityOption)
      ? publicAuthorityOption
      : typeof publicAuthorityOption === "string"
        ? [publicAuthorityOption]
        : [];

    if (Object.keys(errors).length > EMPTY_ARR_LENGTH) {
      res.render("apply/public-authority/add-public-authority", {
        csrfToken,
        publicAuthorityOptions:
          this.formatter.formatPublicAuthorityOptionsIntoList(
            availablePublicAuthorities,
          ),
        selectedPublicAuthorityIds,
        errorSummaries: errors,
      });
    } else {
      session.selectedPublicAuthorities = selectedPublicAuthorityIds
        .map((id) =>
          availablePublicAuthorities.find((a) => a.publicAuthorityId === id),
        )
        .filter((a): a is PublicAuthority => a !== undefined);

      res.redirect("/apply/upload-coroners-letter");
    }
  }

  async #getAvailablePublicAuthorities(
    session: Request["session"],
  ): Promise<PublicAuthority[]> {
    if (session.availablePublicAuthorities !== undefined) {
      return session.availablePublicAuthorities;
    }

    const result = await this.getPublicAuthoritiesUseCase.execute(
      session.accessToken,
    );

    if (result.status !== "SUCCESS" || result.data === undefined) {
      throw new Error(
        result.status === "TECHNICAL_FAILURE"
          ? result.reason
          : "UNEXPECTED_FAILURE",
      );
    }

    const publicAuthorities = this.#mapPublicBodiesToPublicAuthorities(
      result.data,
    );
    // eslint-disable-next-line require-atomic-updates -- Express sessions are per-request; no concurrency risk
    session.availablePublicAuthorities = publicAuthorities;
    return publicAuthorities;
  }

  #mapPublicBodiesToPublicAuthorities(
    publicBodies: GetPublicAuthoritiesResponse,
  ): PublicAuthority[] {
    return publicBodies.map((publicBody) => ({
      publicAuthorityId: publicBody.publicBodyId,
      publicAuthorityDescription: publicBody.publicBodyDescription,
    }));
  }
}
