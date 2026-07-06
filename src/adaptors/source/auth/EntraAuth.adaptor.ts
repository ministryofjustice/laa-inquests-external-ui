import type {
  ConfidentialClientApplication,
  AuthorizationCodeRequest,
  AuthenticationResult,
} from "@azure/msal-node";
import type { AuthPort } from "#src/ports/auth/Auth.port.js";
import type { AuthTokenResult } from "#src/adaptors/source/auth/models/Auth.types.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";

export class EntraAuthAdaptor implements AuthPort {
  constructor(
    private readonly msalClient: ConfidentialClientApplication,
    private readonly tokenDebugEnabled = false,
    private readonly logger: (message: string) => void = () => undefined,
  ) {}

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
    console.log("token result", result);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- MSAL can return null at runtime despite the type signature
    if (result === null) {
      throw new Error("MSAL returned null token result");
    }

    this.#logTokenDetails(result);
    return {
      userId: result.account?.homeAccountId ?? result.uniqueId,
      userName: result.account?.name ?? undefined,
      firmCode: this.#extractFirmCode(result.account?.idTokenClaims),
      officeId: this.#extractOfficeId(result.account?.idTokenClaims),
      providerEmail: result.account?.username ?? undefined,
      ...this.#getAccessTokenField(result),
    };
  }

  #getAccessTokenField(
    result: AuthenticationResult,
  ): Pick<AuthTokenResult, "accessToken"> | Record<string, never> {
    if (typeof result.accessToken === "string" && result.accessToken !== "") {
      return { accessToken: result.accessToken };
    }
    return {};
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

  #getClaim(
    claims: Record<string, unknown> | undefined,
    key: string,
  ): string | undefined {
    const value = claims?.[key];
    return typeof value === "string" && value !== "" ? value : undefined;
  }

  // eslint-disable-next-line complexity -- debug method intentionally captures many fields
  #logTokenDetails(result: AuthenticationResult): void {
    if (!this.tokenDebugEnabled) {
      return;
    }

    const claims = result.account?.idTokenClaims;
    const tokenDetails = {
      event: "auth.token.details",
      userId: result.account?.homeAccountId ?? result.uniqueId,
      providerEmail: result.account?.username ?? undefined,
      preferredUsername: result.account?.idTokenClaims?.preferred_username,
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- intentional string coercion of claim values for debug logging
      providerAccounts: `${result.account?.idTokenClaims?.ACCOUNTS}`,
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- intentional string coercion of claim values for debug logging
      providerFirmCode: `${result.account?.idTokenClaims?.FIRM_CODE}`,
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- intentional string coercion of claim values for debug logging
      providerFirmName: `${result.account?.idTokenClaims?.FIRM_NAME}`,
      tenantId: this.#getClaim(claims, "tid"),
      audience: this.#getClaim(claims, "aud"),
      issuer: this.#getClaim(claims, "iss"),
      subject: this.#getClaim(claims, "sub"),
      expiresOn: result.expiresOn?.toISOString(),
      hasAccessToken: result.accessToken !== "",
      scopesCount: result.scopes.length,
    };

    this.logger(JSON.stringify(tokenDetails));
  }
}
