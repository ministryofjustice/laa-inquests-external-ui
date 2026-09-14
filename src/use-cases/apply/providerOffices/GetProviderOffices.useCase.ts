import type { GetProviderOfficesPort } from "#src/ports/source/inquests-api/GetProviderOffices.port.js";
import type { GetProviderOfficesResponse } from "#src/adaptors/source/inquests-api/apply/GetProviderOffices/models/GetProviderOffices.types.js";

export class GetProviderOfficesUseCase {
  constructor(
    private readonly getProviderOfficesPort: GetProviderOfficesPort,
  ) {}

  async execute(
    firmId: string,
    accessToken: string | undefined,
  ): Promise<GetProviderOfficesResponse> {
    return await this.getProviderOfficesPort.getProviderOffices(
      firmId,
      accessToken,
    );
  }
}
