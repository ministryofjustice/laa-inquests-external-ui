import { simulation, rampUsers } from "@gatling.io/core";
import { http } from "@gatling.io/http";
import { applyJourneyScenario } from "../scenario/applyJourney.scenario.js";
import { resolveBaseUrl } from "../config/environment.js";

// TC3 (IDDS-752 plan) — peak concurrency: validates the service can handle
// the full known population of ~80 providers using it at once. This is a
// deliberate concurrency ceiling, not typical daily traffic (see the plan's
// Little's Law reasoning for normal vs peak concurrency).
const PEAK_PROVIDER_COUNT = 80;
const RAMP_UP_DURATION = { amount: 2, unit: "minutes" } as const;

export default simulation((setUp) => {
  const httpProtocol = http.baseUrl(resolveBaseUrl());

  setUp(
    applyJourneyScenario.injectOpen(
      rampUsers(PEAK_PROVIDER_COUNT).during(RAMP_UP_DURATION),
    ),
  ).protocols(httpProtocol);
});
