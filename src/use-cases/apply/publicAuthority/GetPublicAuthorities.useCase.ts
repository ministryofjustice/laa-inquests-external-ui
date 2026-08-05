import type { GetPublicAuthoritiesPort } from "#src/ports/source/inquests-api/GetPublicAuthorities.port.js";
import type { GetPublicAuthoritiesResponse } from "#src/adaptors/source/inquests-api/apply/GetPublicAuthorities/models/GetPublicAuthorities.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";

export class GetPublicAuthoritiesUseCase {
  constructor(
    private readonly getPublicAuthoritiesPort: GetPublicAuthoritiesPort,
  ) {}

  async execute(
    accessToken: string | undefined,
  ): Promise<UseCaseResult<GetPublicAuthoritiesResponse>> {
    try {
      const publicAuthorities =
        await this.getPublicAuthoritiesPort.getPublicAuthorities(accessToken);

      return {
        status: "SUCCESS",
        data: publicAuthorities,
      };
    } catch {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
  }
}
