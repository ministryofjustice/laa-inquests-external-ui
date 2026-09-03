export interface AuthTokenResult {
  userId: string;
  userName?: string;
  officeId?: string;
  providerEmail?: string;
  accessToken?: string;
  accessTokenExpiresOn?: Date;
}
