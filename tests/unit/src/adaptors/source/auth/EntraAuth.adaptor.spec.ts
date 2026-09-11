import { strict as assert } from "assert";
import sinon from "sinon";
import type { ConfidentialClientApplication } from "@azure/msal-node";
import { stubInterface } from "ts-sinon";
import { EntraAuthAdaptor } from "#src/adaptors/source/auth/EntraAuth.adaptor.js";
import {
  ApplicationError,
  APPLICATION_ERROR_TYPES,
} from "#src/use-cases/common/ApplicationError.js";

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
    it("returns AuthTokenResult with userId, userName, firmId, officeId and providerEmail from token claims", async () => {
      msalClient.acquireTokenByCode.resolves({
        account: {
          homeAccountId: "user-oid-123",
          name: "Test User",
          username: "test@example.com",
          idTokenClaims: { FIRM_CODE: "123", ACCOUNTS: "A001B" },
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
        firmId: "123",
        officeId: "A001B",
        userOfficeAccounts: ["A001B"],
        providerEmail: "test@example.com",
        roles: [],
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
          idTokenClaims: { FIRM_CODE: "123", ACCOUNTS: "A001B" },
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
        firmId: "123",
        officeId: "A001B",
        userOfficeAccounts: ["A001B"],
        providerEmail: "test@example.com",
        roles: [],
      });
    });

    it("returns undefined providerEmail when account username is absent", async () => {
      msalClient.acquireTokenByCode.resolves({
        account: {
          homeAccountId: "user-oid-123",
          idTokenClaims: { FIRM_CODE: "123", ACCOUNTS: "A001B" },
        },
      } as any);

      const result = await adaptor.acquireTokenByCode(
        "auth-code",
        SCOPES,
        REDIRECT_URI,
      );

      assert.equal(result.providerEmail, undefined);
    });

    it("returns undefined officeId when ACCOUNTS claim is missing", async () => {
      msalClient.acquireTokenByCode.resolves({
        account: {
          homeAccountId: "user-oid-123",
          idTokenClaims: { FIRM_CODE: "123" },
        },
      } as any);

      const result = await adaptor.acquireTokenByCode(
        "auth-code",
        SCOPES,
        REDIRECT_URI,
      );

      assert.equal(result.officeId, undefined);
    });

    it("splits a comma-separated ACCOUNTS claim into userOfficeAccounts, trimming whitespace", async () => {
      msalClient.acquireTokenByCode.resolves({
        account: {
          homeAccountId: "user-oid-123",
          idTokenClaims: {
            FIRM_CODE: "123",
            ACCOUNTS: "2P223Y, 2N861E,2P224Z ,2F761M",
          },
        },
      } as any);

      const result = await adaptor.acquireTokenByCode(
        "auth-code",
        SCOPES,
        REDIRECT_URI,
      );

      assert.deepEqual(result.userOfficeAccounts, [
        "2P223Y",
        "2N861E",
        "2P224Z",
        "2F761M",
      ]);
    });

    it("returns an empty userOfficeAccounts array when ACCOUNTS claim is missing", async () => {
      msalClient.acquireTokenByCode.resolves({
        account: {
          homeAccountId: "user-oid-123",
          idTokenClaims: { FIRM_CODE: "123" },
        },
      } as any);

      const result = await adaptor.acquireTokenByCode(
        "auth-code",
        SCOPES,
        REDIRECT_URI,
      );

      assert.deepEqual(result.userOfficeAccounts, []);
    });

    it("returns userOfficeAccounts from an array-valued ACCOUNTS claim", async () => {
      msalClient.acquireTokenByCode.resolves({
        account: {
          homeAccountId: "user-oid-123",
          idTokenClaims: {
            FIRM_CODE: "123",
            ACCOUNTS: ["2P223Y", "2N861E", "2P224Z", "2F761M"],
          },
        },
      } as any);

      const result = await adaptor.acquireTokenByCode(
        "auth-code",
        SCOPES,
        REDIRECT_URI,
      );

      assert.deepEqual(result.userOfficeAccounts, [
        "2P223Y",
        "2N861E",
        "2P224Z",
        "2F761M",
      ]);
    });

    it("uses the first element of an array-valued ACCOUNTS claim as officeId", async () => {
      msalClient.acquireTokenByCode.resolves({
        account: {
          homeAccountId: "user-oid-123",
          idTokenClaims: {
            FIRM_CODE: "123",
            ACCOUNTS: ["2P223Y", "2N861E"],
          },
        },
      } as any);

      const result = await adaptor.acquireTokenByCode(
        "auth-code",
        SCOPES,
        REDIRECT_URI,
      );

      assert.equal(result.officeId, "2P223Y");
    });

    it("returns undefined firmId when FIRM_CODE claim is missing", async () => {
      msalClient.acquireTokenByCode.resolves({
        account: {
          homeAccountId: "user-oid-123",
          idTokenClaims: { ACCOUNTS: "A001B" },
        },
      } as any);

      const result = await adaptor.acquireTokenByCode(
        "auth-code",
        SCOPES,
        REDIRECT_URI,
      );

      assert.equal(result.firmId, undefined);
    });

    describe("role extraction", () => {
      it("extracts recognised roles from an array-valued LAA_APP_ROLES claim", async () => {
        msalClient.acquireTokenByCode.resolves({
          account: {
            homeAccountId: "user-oid-123",
            idTokenClaims: {
              FIRM_CODE: "123",
              LAA_APP_ROLES: [
                "Inquests - Provider Application User",
                "Inquests - Provider Claims User",
              ],
            },
          },
        } as any);

        const result = await adaptor.acquireTokenByCode(
          "auth-code",
          SCOPES,
          REDIRECT_URI,
        );

        assert.deepEqual(result.roles, [
          "Inquests - Provider Application User",
          "Inquests - Provider Claims User",
        ]);
      });

      it("extracts recognised roles from a comma-separated LAA_APP_ROLES claim, trimming whitespace", async () => {
        msalClient.acquireTokenByCode.resolves({
          account: {
            homeAccountId: "user-oid-123",
            idTokenClaims: {
              FIRM_CODE: "123",
              LAA_APP_ROLES:
                "Inquests - Provider Application User , Inquests - Provider Claims User",
            },
          },
        } as any);

        const result = await adaptor.acquireTokenByCode(
          "auth-code",
          SCOPES,
          REDIRECT_URI,
        );

        assert.deepEqual(result.roles, [
          "Inquests - Provider Application User",
          "Inquests - Provider Claims User",
        ]);
      });

      it("deduplicates repeated roles in the LAA_APP_ROLES claim", async () => {
        msalClient.acquireTokenByCode.resolves({
          account: {
            homeAccountId: "user-oid-123",
            idTokenClaims: {
              FIRM_CODE: "123",
              LAA_APP_ROLES: [
                "Inquests - Provider Application User",
                "Inquests - Provider Application User",
              ],
            },
          },
        } as any);

        const result = await adaptor.acquireTokenByCode(
          "auth-code",
          SCOPES,
          REDIRECT_URI,
        );

        assert.deepEqual(result.roles, [
          "Inquests - Provider Application User",
        ]);
      });

      it("ignores unrecognised roles in the LAA_APP_ROLES claim", async () => {
        msalClient.acquireTokenByCode.resolves({
          account: {
            homeAccountId: "user-oid-123",
            idTokenClaims: {
              FIRM_CODE: "123",
              LAA_APP_ROLES: [
                "Inquests - Random Role",
                "Inquests - Provider Claims User",
              ],
            },
          },
        } as any);

        const result = await adaptor.acquireTokenByCode(
          "auth-code",
          SCOPES,
          REDIRECT_URI,
        );

        assert.deepEqual(result.roles, ["Inquests - Provider Claims User"]);
      });

      it("returns an empty roles array when the LAA_APP_ROLES claim is missing", async () => {
        msalClient.acquireTokenByCode.resolves({
          account: {
            homeAccountId: "user-oid-123",
            idTokenClaims: { FIRM_CODE: "123" },
          },
        } as any);

        const result = await adaptor.acquireTokenByCode(
          "auth-code",
          SCOPES,
          REDIRECT_URI,
        );

        assert.deepEqual(result.roles, []);
      });

      it("returns an empty roles array when the LAA_APP_ROLES claim is malformed", async () => {
        msalClient.acquireTokenByCode.resolves({
          account: {
            homeAccountId: "user-oid-123",
            idTokenClaims: {
              FIRM_CODE: "123",
              LAA_APP_ROLES: { unexpected: 1 },
            },
          },
        } as any);

        const result = await adaptor.acquireTokenByCode(
          "auth-code",
          SCOPES,
          REDIRECT_URI,
        );

        assert.deepEqual(result.roles, []);
      });
    });

    it("surfaces the token expiry from the MSAL result", async () => {
      const expiresOn = new Date("2026-09-03T12:00:00.000Z");
      msalClient.acquireTokenByCode.resolves({
        account: {
          homeAccountId: "user-oid-123",
          name: "Test User",
          idTokenClaims: { FIRM_CODE: "123", ACCOUNTS: "A001B" },
        },
        accessToken: "access-token-123",
        expiresOn,
      } as any);

      const result = await adaptor.acquireTokenByCode(
        "auth-code",
        SCOPES,
        REDIRECT_URI,
      );

      assert.deepEqual(result.accessTokenExpiresOn, expiresOn);
    });

    it("translates a null MSAL result into a sanitized ApplicationError", async () => {
      msalClient.acquireTokenByCode.resolves(null as any);

      await assert.rejects(
        () => adaptor.acquireTokenByCode("auth-code", SCOPES, REDIRECT_URI),
        (err: unknown) => {
          assert.ok(err instanceof ApplicationError);
          assert.equal(err.type, APPLICATION_ERROR_TYPES.UPSTREAM_UNAVAILABLE);
          assert.equal(err.operation, "acquire_token");
          assert.equal(err.cause, undefined);
          assert.doesNotMatch(err.message, /MSAL returned null token result/);
          return true;
        },
      );
    });

    it("translates an MSAL exception into a sanitized ApplicationError", async () => {
      msalClient.acquireTokenByCode.rejects(new Error("token endpoint error"));

      await assert.rejects(
        () => adaptor.acquireTokenByCode("auth-code", SCOPES, REDIRECT_URI),
        (err: unknown) => {
          assert.ok(err instanceof ApplicationError);
          assert.equal(err.type, APPLICATION_ERROR_TYPES.UPSTREAM_UNAVAILABLE);
          assert.equal(err.operation, "acquire_token");
          assert.equal(err.cause, undefined);
          assert.doesNotMatch(err.message, /token endpoint error/);
          return true;
        },
      );
    });
  });
});
