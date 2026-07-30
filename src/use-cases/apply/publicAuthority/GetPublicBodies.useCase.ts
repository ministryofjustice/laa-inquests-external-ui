import type { GetPublicBodiesPort } from "#src/ports/source/inquests-api/GetPublicBodies.port.js";
import type { GetPublicBodiesResponse } from "#src/adaptors/source/inquests-api/apply/GetPublicBodies/models/GetPublicBodies.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";

export class GetPublicBodiesUseCase {
  constructor(private readonly getPublicBodiesPort: GetPublicBodiesPort) {}

  async execute(
    accessToken: string | undefined,
  ): Promise<UseCaseResult<GetPublicBodiesResponse>> {
    try {
      const publicBodies =
        await this.getPublicBodiesPort.getPublicBodies(accessToken);

      return {
        status: "SUCCESS",
        data: publicBodies,
      };
    } catch {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
  }
}
