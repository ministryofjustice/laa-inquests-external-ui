import type { GetProviderOfficesPort } from "#src/ports/source/inquests-api/GetProviderOffices.port.js";
import type { GetProviderOfficesResponse } from "#src/adaptors/source/inquests-api/apply/GetProviderOffices/models/GetProviderOffices.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";
import { logger } from "#src/infrastructure/logging/logger.js";

export class GetProviderOfficesUseCase {
  constructor(
    private readonly getProviderOfficesPort: GetProviderOfficesPort,
  ) {}

  async execute(
    firmId: string,
    accessToken: string | undefined,
  ): Promise<UseCaseResult<GetProviderOfficesResponse>> {
    try {
      const providerOffices =
        await this.getProviderOfficesPort.getProviderOffices(
          firmId,
          accessToken,
        );

      return {
        status: "SUCCESS",
        data: providerOffices,
      };
    } catch (err) {
      logger.logError({
        functionName: "getProviderOfficesUseCase_execute",
        message: "Provider offices retrieval failed with exception",
        err,
        extraContext: {
          event: "provider_offices_retrieval_failed",
          reason: "UNEXPECTED_EXCEPTION",
        },
      });
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
  }
}
