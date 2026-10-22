import { strict as assert } from "assert";
import config from "#src/infrastructure/config/config.js";
import { hashSessionId } from "#src/infrastructure/express/session/sessionHash.js";

describe("hashSessionId", () => {
  let originalSecret: string;

  beforeEach(() => {
    originalSecret = config.SESSION_LOG_HASH_SECRET;
  });

  afterEach(() => {
    config.SESSION_LOG_HASH_SECRET = originalSecret;
  });

  it("returns the HMAC-SHA256 hex digest using the configured secret", () => {
    config.SESSION_LOG_HASH_SECRET = "Jefe";

    assert.equal(
      hashSessionId("what do ya want for nothing?"),
      "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
    );
  });
});
