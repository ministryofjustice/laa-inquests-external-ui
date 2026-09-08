import type { Request, Response } from "express";
import type { GetProviderOfficesPort } from "#src/ports/source/inquests-api/GetProviderOffices.port.js";
import { GetProviderOfficesUseCase } from "#src/use-cases/apply/providerOffices/GetProviderOffices.useCase.js";
import type { GetProviderOffice } from "#src/adaptors/source/inquests-api/apply/GetProviderOffices/models/GetProviderOffices.types.js";

interface OfficeAccountsUseCases {
  getProviderOffices: GetProviderOfficesUseCase;
}

interface OfficeAccountsOption {
  value: string;
  html: string;
  hint: { text: string };
}

export class OfficeAccountsAdaptor {
  getProviderOfficesUseCase: GetProviderOfficesUseCase;

  constructor(
    getProviderOfficesPort: GetProviderOfficesPort,
    useCases?: Partial<OfficeAccountsUseCases>,
  ) {
    this.getProviderOfficesUseCase =
      useCases?.getProviderOffices ??
      new GetProviderOfficesUseCase(getProviderOfficesPort);
  }

  async renderOfficeAccountsSelectForm(
    req: Request,
    res: Response,
  ): Promise<void> {
    const {
      locals: { csrfToken },
    } = res;

    const firmId = this.#resolveFirmId(req);
    const officeOptions = await this.#getOfficeOptions(req, firmId);

    res.render("apply/office-accounts/select-office-account", {
      csrfToken,
      officeOptions,
    });
  }

  async #getOfficeOptions(
    req: Request,
    firmId: string,
  ): Promise<OfficeAccountsOption[]> {
    if (firmId === "") {
      return [];
    }

    const result = await this.getProviderOfficesUseCase.execute(
      firmId,
      req.session.accessToken,
    );

    if (result.status !== "SUCCESS" || result.data === undefined) {
      throw new Error(
        result.status === "TECHNICAL_FAILURE"
          ? result.reason
          : "UNEXPECTED_FAILURE",
      );
    }

    return this.#formatOfficeOptions(result.data);
  }

  #formatOfficeOptions(offices: GetProviderOffice[]): OfficeAccountsOption[] {
    return offices.map((office) => ({
      value: office.officeCode,
      html: `<strong>${this.#formatAddress(office)}</strong>`,
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
