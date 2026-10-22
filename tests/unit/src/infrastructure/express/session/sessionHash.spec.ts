import { strict as assert } from "assert";
import config from "#src/infrastructure/config/config.js";
import { hashSessionId } from "#src/infrastructure/express/session/sessionHash.js";

const SHA256_HEX_LENGTH = 64;

describe("hashSessionId", () => {
  let originalSecret: string;

  beforeEach(() => {
    originalSecret = config.SESSION_LOG_HASH_SECRET;
  });

  afterEach(() => {
    config.SESSION_LOG_HASH_SECRET = originalSecret;
  });

  it("returns the same hash for the same session id", () => {
    assert.equal(hashSessionId("session-abc"), hashSessionId("session-abc"));
  });

  it("returns different hashes for different session ids", () => {
    assert.notEqual(hashSessionId("session-abc"), hashSessionId("session-xyz"));
  });

  it("returns a hex sha256 digest that does not contain the session id", () => {
    const hash = hashSessionId("session-abc");

    assert.match(hash, /^[0-9a-f]+$/);
    assert.equal(hash.length, SHA256_HEX_LENGTH);
    assert.equal(hash.includes("session-abc"), false);
  });

  it("returns the HMAC-SHA256 hex digest using the configured secret", () => {
    config.SESSION_LOG_HASH_SECRET = "Jefe";

    assert.equal(
      hashSessionId("what do ya want for nothing?"),
      "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
    );
  });
});
