import type { ProviderRole } from "#src/infrastructure/config/accessControl.js";

export interface AuthTokenResult {
  userId: string;
  userName?: string;
  firmId?: string;
  userOfficeAccounts: string[];
  providerEmail?: string;
  accessToken?: string;
  accessTokenExpiresOn?: Date;
  roles: ProviderRole[];
}
