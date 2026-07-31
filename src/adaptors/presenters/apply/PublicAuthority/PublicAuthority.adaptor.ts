import type { Request, Response } from "express";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  PublicAuthorityValidator,
  PublicAuthorityFormData,
} from "./PublicAuthority.validator.js";
import type { Formatter } from "#src/utils/Formatter.js";
import type { GetPublicBodiesPort } from "#src/ports/source/inquests-api/GetPublicBodies.port.js";
import { GetPublicBodiesUseCase } from "#src/use-cases/apply/publicAuthority/GetPublicBodies.useCase.js";
import type { PublicAuthority } from "#src/infrastructure/express/session/index.types.js";
import type { GetPublicBodiesResponse } from "#src/adaptors/source/inquests-api/apply/GetPublicBodies/models/GetPublicBodies.types.js";

interface PublicAuthorityUseCases {
  getPublicBodies: GetPublicBodiesUseCase;
}

export class PublicAuthorityAdaptor {
  formValidator: PublicAuthorityValidator;
  formatter: Formatter;
  getPublicBodiesUseCase: GetPublicBodiesUseCase;

  constructor(
    formValidator: PublicAuthorityValidator,
    formatter: Formatter,
    getPublicBodiesPort: GetPublicBodiesPort,
    useCases?: Partial<PublicAuthorityUseCases>,
  ) {
    this.formValidator = formValidator;
    this.formatter = formatter;
    this.getPublicBodiesUseCase =
      useCases?.getPublicBodies ??
      new GetPublicBodiesUseCase(getPublicBodiesPort);
  }

  async renderPublicAuthoritySelectForm(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { session } = req;
    const {
      locals: { csrfToken },
    } = res;

    const getPublicBodiesResult = await this.getPublicBodiesUseCase.execute(
      session.accessToken,
    );

    if (
      getPublicBodiesResult.status !== "SUCCESS" ||
      getPublicBodiesResult.data === undefined
    ) {
      throw new Error(
        getPublicBodiesResult.status === "TECHNICAL_FAILURE"
          ? getPublicBodiesResult.reason
          : "UNEXPECTED_FAILURE",
      );
    }

    const publicAuthorityOptions = this.#mapPublicBodiesToPublicAuthorities(
      getPublicBodiesResult.data,
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

    const result = await this.getPublicBodiesUseCase.execute(
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

  // This isn't great because we call public bodies and authorities the different things
  // Will make a follow up PR to standardise names, but it's a 40-file change so exluding from this PR for now
  #mapPublicBodiesToPublicAuthorities(
    publicBodies: GetPublicBodiesResponse,
  ): PublicAuthority[] {
    return publicBodies.map((publicBody) => ({
      publicAuthorityId: publicBody.publicBodyId,
      publicAuthorityDescription: publicBody.publicBodyDescription,
    }));
  }
}
