import type { GetPublicAuthoritiesPort } from "#src/ports/source/inquests-api/GetPublicAuthorities.port.js";
import type { GetPublicAuthoritiesResponse } from "#src/adaptors/source/inquests-api/apply/GetPublicAuthorities/models/GetPublicAuthorities.types.js";

export class GetPublicAuthoritiesUseCase {
  constructor(
    private readonly getPublicAuthoritiesPort: GetPublicAuthoritiesPort,
  ) {}

  async execute(
    accessToken: string | undefined,
  ): Promise<GetPublicAuthoritiesResponse> {
    return await this.getPublicAuthoritiesPort.getPublicAuthorities(
      accessToken,
    );
  }
}
