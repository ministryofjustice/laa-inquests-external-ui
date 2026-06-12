import type { AuthPort } from "#src/ports/auth/Auth.port.js";
import type { AuthTokenResult } from "#src/adaptors/source/auth/models/Auth.types.js";

const MOCK_OAUTH_PORT = 4001;

export class MockAuthAdaptor implements AuthPort {
  constructor(private readonly mockOAuthUrl: string) {}

  async getAuthCodeUrl(
    _scopes: string[],
    redirectUri: string,
  ): Promise<string> {
    const params = new URLSearchParams({ redirect_uri: redirectUri });
    return await Promise.resolve(
      `${this.mockOAuthUrl}/authorize?${params.toString()}`,
    );
  }

  async acquireTokenByCode(code: string): Promise<AuthTokenResult> {
    return await Promise.resolve({
      userId: code,
      userName: "Test User",
      firmCode: "0A123B",
      officeId: "001",
    });
  }
}

export { MOCK_OAUTH_PORT };
