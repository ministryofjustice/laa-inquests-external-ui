import { strict as assert } from "assert";
import sinon from "sinon";
import type { ConfidentialClientApplication } from "@azure/msal-node";
import { stubInterface } from "ts-sinon";
import { EntraAuthAdaptor } from "#src/adaptors/source/auth/EntraAuth.adaptor.js";

const SCOPES = ["openid", "profile", "offline_access"];
const REDIRECT_URI = "http://localhost:3000/auth/callback";

describe("EntraAuthAdaptor", () => {
  let msalClient: ReturnType<
    typeof stubInterface<ConfidentialClientApplication>
  >;
  let adaptor: EntraAuthAdaptor;

  beforeEach(() => {
    msalClient = stubInterface<ConfidentialClientApplication>();
    adaptor = new EntraAuthAdaptor(
      msalClient as unknown as ConfidentialClientApplication,
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("getAuthCodeUrl", () => {
    it("returns an auth code URL from MSAL", async () => {
      const expectedUrl =
        "https://login.microsoftonline.com/test-tenant/oauth2/v2.0/authorize?client_id=test";
      msalClient.getAuthCodeUrl.resolves(expectedUrl);

      const result = await adaptor.getAuthCodeUrl(SCOPES, REDIRECT_URI);

      assert.equal(result, expectedUrl);
      assert.ok(
        msalClient.getAuthCodeUrl.calledOnceWith({
          scopes: SCOPES,
          redirectUri: REDIRECT_URI,
        }),
      );
    });

    it("propagates error when MSAL throws on getAuthCodeUrl", async () => {
      msalClient.getAuthCodeUrl.rejects(new Error("MSAL network failure"));

      await assert.rejects(
        () => adaptor.getAuthCodeUrl(SCOPES, REDIRECT_URI),
        /MSAL network failure/,
      );
    });
  });

  describe("acquireTokenByCode", () => {
    it("returns AuthTokenResult with userId, userName, firmCode, officeId and providerEmail from token claims", async () => {
      msalClient.acquireTokenByCode.resolves({
        account: {
          homeAccountId: "user-oid-123",
          name: "Test User",
          username: "test@example.com",
          idTokenClaims: { FIRM_CODE: "0A123B", ACCOUNTS: "001" },
        },
        accessToken: "access-token-123",
      } as any);

      const result = await adaptor.acquireTokenByCode(
        "auth-code",
        SCOPES,
        REDIRECT_URI,
      );

      assert.deepEqual(result, {
        userId: "user-oid-123",
        userName: "Test User",
        firmCode: "0A123B",
        officeId: "001",
        providerEmail: "test@example.com",
        accessToken: "access-token-123",
      });
      assert.ok(
        msalClient.acquireTokenByCode.calledOnceWith({
          code: "auth-code",
          scopes: SCOPES,
          redirectUri: REDIRECT_URI,
        }),
      );
    });

    it("returns AuthTokenResult with undefined userName when account name is absent", async () => {
      msalClient.acquireTokenByCode.resolves({
        account: {
          homeAccountId: "user-oid-123",
          username: "test@example.com",
          idTokenClaims: { FIRM_CODE: "0A123B", ACCOUNTS: "001" },
        },
        uniqueId: "user-oid-123",
      } as any);

      const result = await adaptor.acquireTokenByCode(
        "auth-code",
        SCOPES,
        REDIRECT_URI,
      );

      assert.deepEqual(result, {
        userId: "user-oid-123",
        userName: undefined,
        firmCode: "0A123B",
        officeId: "001",
        providerEmail: "test@example.com",
      });
    });

    it("returns undefined providerEmail when account username is absent", async () => {
      msalClient.acquireTokenByCode.resolves({
        account: {
          homeAccountId: "user-oid-123",
          idTokenClaims: { FIRM_CODE: "0A123B", ACCOUNTS: "001" },
        },
      } as any);

      const result = await adaptor.acquireTokenByCode(
        "auth-code",
        SCOPES,
        REDIRECT_URI,
      );

      assert.equal(result.providerEmail, undefined);
    });

    it("uses first element of ACCOUNTS array as officeId", async () => {
      msalClient.acquireTokenByCode.resolves({
        account: {
          homeAccountId: "user-oid-123",
          name: "Test User",
          idTokenClaims: { FIRM_CODE: "0A123B", ACCOUNTS: ["001", "002"] },
        },
      } as any);

      const result = await adaptor.acquireTokenByCode(
        "auth-code",
        SCOPES,
        REDIRECT_URI,
      );

      assert.equal(result.officeId, "001");
    });

    it("returns undefined firmCode when FIRM_CODE claim is missing", async () => {
      msalClient.acquireTokenByCode.resolves({
        account: {
          homeAccountId: "user-oid-123",
          idTokenClaims: { ACCOUNTS: "001" },
        },
      } as any);

      const result = await adaptor.acquireTokenByCode(
        "auth-code",
        SCOPES,
        REDIRECT_URI,
      );

      assert.equal(result.firmCode, undefined);
    });

    it("returns undefined officeId when ACCOUNTS claim is missing", async () => {
      msalClient.acquireTokenByCode.resolves({
        account: {
          homeAccountId: "user-oid-123",
          idTokenClaims: { FIRM_CODE: "0A123B" },
        },
      } as any);

      const result = await adaptor.acquireTokenByCode(
        "auth-code",
        SCOPES,
        REDIRECT_URI,
      );

      assert.equal(result.officeId, undefined);
    });

    it("throws when MSAL returns null", async () => {
      msalClient.acquireTokenByCode.resolves(null as any);

      await assert.rejects(
        () => adaptor.acquireTokenByCode("auth-code", SCOPES, REDIRECT_URI),
        /MSAL returned null token result/,
      );
    });

    it("propagates error when MSAL throws on acquireTokenByCode", async () => {
      msalClient.acquireTokenByCode.rejects(new Error("token endpoint error"));

      await assert.rejects(
        () => adaptor.acquireTokenByCode("auth-code", SCOPES, REDIRECT_URI),
        /token endpoint error/,
      );
    });
  });
});
