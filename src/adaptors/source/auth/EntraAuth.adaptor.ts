import type {
  ConfidentialClientApplication,
  AuthorizationCodeRequest,
} from "@azure/msal-node";
import type { AuthPort } from "#src/ports/auth/Auth.port.js";
import type { AuthTokenResult } from "#src/adaptors/source/auth/models/Auth.types.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";

export class EntraAuthAdaptor implements AuthPort {
  constructor(private readonly msalClient: ConfidentialClientApplication) {}

  async getAuthCodeUrl(scopes: string[], redirectUri: string): Promise<string> {
    return await this.msalClient.getAuthCodeUrl({ scopes, redirectUri });
  }

  async acquireTokenByCode(
    code: string,
    scopes: string[],
    redirectUri: string,
  ): Promise<AuthTokenResult> {
    const request: AuthorizationCodeRequest = { code, scopes, redirectUri };
    const result = await this.msalClient.acquireTokenByCode(request);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- MSAL can return null at runtime despite the type signature
    if (result === null) {
      throw new Error("MSAL returned null token result");
    }

    return {
      userId: result.account?.homeAccountId ?? result.uniqueId,
      userName: result.account?.name ?? undefined,
      firmCode: this.#extractFirmCode(result.account?.idTokenClaims),
      officeId: this.#extractOfficeId(result.account?.idTokenClaims),
      providerEmail: result.account?.username ?? undefined,
    };
  }

  #extractFirmCode(
    claims: Record<string, unknown> | undefined,
  ): string | undefined {
    const value = claims?.FIRM_CODE;
    if (typeof value === "string" && value !== "") {
      return value;
    }
    return undefined;
  }

  #extractOfficeId(
    claims: Record<string, unknown> | undefined,
  ): string | undefined {
    const value = claims?.ACCOUNTS;
    if (typeof value === "string" && value !== "") {
      return value;
    }
    if (
      Array.isArray(value) &&
      value.length > EMPTY_ARR_LENGTH &&
      typeof value[EMPTY_ARR_LENGTH] === "string"
    ) {
      return value[EMPTY_ARR_LENGTH];
    }
    return undefined;
  }
}
