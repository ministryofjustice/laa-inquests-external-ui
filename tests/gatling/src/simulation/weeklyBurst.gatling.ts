import { simulation, constantUsersPerSec } from "@gatling.io/core";
import { http } from "@gatling.io/http";
import { applyJourneyScenario } from "../scenario/applyJourney.scenario.js";
import { resolveBaseUrl } from "../config/environment.js";

// TC4 (IDDS-752 plan) — a week's worth of applications arriving in one
// afternoon. The literal scenario is 212 applications (11,000/yr ÷ 52 weeks)
// over a 4-hour afternoon (≈0.0147 users/sec). That real-time window exceeds
// the ~60-90 minute lifetime of a manually-supplied access token, so this
// compresses the SAME total volume into a shorter window instead — a more
// demanding version of the same scenario (same total load, delivered faster),
// not a literal reproduction of the 4-hour timeline. Revisit with the full
// 4-hour duration once a longer-lived credential (e.g. a non-MFA ROPC test
// account) removes the token-lifetime constraint.
const APPLICATIONS_PER_WEEK = 212; // 11,000 / 52
const COMPRESSED_WINDOW_MINUTES = 20;
const SECONDS_PER_MINUTE = 60;
const ratePerSecond =
  APPLICATIONS_PER_WEEK / (COMPRESSED_WINDOW_MINUTES * SECONDS_PER_MINUTE);

export default simulation((setUp) => {
  const httpProtocol = http.baseUrl(resolveBaseUrl());

  setUp(
    applyJourneyScenario.injectOpen(
      constantUsersPerSec(ratePerSecond).during({
        amount: COMPRESSED_WINDOW_MINUTES,
        unit: "minutes",
      }),
    ),
  ).protocols(httpProtocol);
});
