import type { Request, Response } from "express";
import {
  EMPTY_ARR_LENGTH,
  HTTP_SERVICE_UNAVAILABLE,
} from "#src/infrastructure/locales/constants.js";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  PublicAuthorityValidator,
  PublicAuthorityFormData,
} from "./PublicAuthority.validator.js";
import type { Formatter } from "#src/utils/Formatter.js";
import { AddPublicAuthorityUseCase } from "#src/use-cases/apply/publicAuthority/AddPublicAuthority.useCase.js";
import type { GetPublicBodiesPort } from "#src/ports/source/inquests-api/GetPublicBodies.port.js";
import { GetPublicBodiesUseCase } from "#src/use-cases/apply/publicAuthority/GetPublicBodies.useCase.js";
import type { PublicAuthority } from "#src/infrastructure/express/session/index.types.js";
import type { GetPublicBodiesResponse } from "#src/adaptors/source/inquests-api/apply/GetPublicBodies/models/GetPublicBodies.types.js";

interface PublicAuthorityUseCases {
  addPublicAuthority: AddPublicAuthorityUseCase;
  getPublicBodies: GetPublicBodiesUseCase;
}

export class PublicAuthorityAdaptor {
  formValidator: PublicAuthorityValidator;
  formatter: Formatter;
  addPublicAuthorityUseCase: AddPublicAuthorityUseCase;
  getPublicBodiesUseCase: GetPublicBodiesUseCase;

  constructor(
    formValidator: PublicAuthorityValidator,
    formatter: Formatter,
    getPublicBodiesPort: GetPublicBodiesPort,
    useCases?: Partial<PublicAuthorityUseCases>,
  ) {
    this.formValidator = formValidator;
    this.formatter = formatter;
    this.addPublicAuthorityUseCase =
      useCases?.addPublicAuthority ?? new AddPublicAuthorityUseCase();
    this.getPublicBodiesUseCase =
      useCases?.getPublicBodies ??
      new GetPublicBodiesUseCase(getPublicBodiesPort);
  }

  async renderPublicAuthoritySelectForm(
    req: Request,
    res: Response,
  ): Promise<void> {
    const {
      locals: { csrfToken },
    } = res;

    const getPublicBodiesResult = await this.getPublicBodiesUseCase.execute(
      req.session.accessToken,
    );

    if (
      getPublicBodiesResult.status !== "SUCCESS" ||
      getPublicBodiesResult.data === undefined
    ) {
      res.status(HTTP_SERVICE_UNAVAILABLE).render("main/error", {
        status: "503",
        error: "Service unavailable. Please try again later.",
      });
      return;
    }

    const publicAuthorityOptions = this.#mapPublicBodiesToPublicAuthorities(
      getPublicBodiesResult.data,
    );

    const selectedPublicAuthorityIds =
      req.session.selectedPublicAuthorities?.map(
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

    const getPublicBodiesResult = await this.getPublicBodiesUseCase.execute(
      session.accessToken,
    );

    if (
      getPublicBodiesResult.status !== "SUCCESS" ||
      getPublicBodiesResult.data === undefined
    ) {
      res.status(HTTP_SERVICE_UNAVAILABLE).render("main/error", {
        status: "503",
        error: "Service unavailable. Please try again later.",
      });
      return;
    }

    const publicAuthorityOptions = this.#mapPublicBodiesToPublicAuthorities(
      getPublicBodiesResult.data,
    );

    const errors = this.formValidator.validatePublicAuthorityInput(req.body);

    const addPublicAuthorityResult = this.addPublicAuthorityUseCase.execute(
      publicAuthorityOption,
      publicAuthorityOptions,
    );

    const selectedPublicAuthorityIds = Array.isArray(publicAuthorityOption)
      ? publicAuthorityOption
      : typeof publicAuthorityOption === "string"
        ? [publicAuthorityOption]
        : [];

    if (
      Object.keys(errors).length > EMPTY_ARR_LENGTH ||
      addPublicAuthorityResult.status !== "SUCCESS" ||
      addPublicAuthorityResult.data === undefined
    ) {
      res.render("apply/public-authority/add-public-authority", {
        csrfToken,
        publicAuthorityOptions:
          this.formatter.formatPublicAuthorityOptionsIntoList(
            publicAuthorityOptions,
          ),
        selectedPublicAuthorityIds,
        errorSummaries: errors,
      });
    } else {
      const { data } = addPublicAuthorityResult;
      const { selectedPublicAuthorities } = data;

      session.selectedPublicAuthorities = selectedPublicAuthorities;

      res.redirect("/apply/upload-coroners-letter");
    }
  }

  #mapPublicBodiesToPublicAuthorities(
    publicBodies: GetPublicBodiesResponse,
  ): PublicAuthority[] {
    return publicBodies.map((publicBody) => ({
      publicAuthorityId: publicBody.publicBodyId,
      publicAuthorityDescription: publicBody.publicBodyDescription,
    }));
  }
}
