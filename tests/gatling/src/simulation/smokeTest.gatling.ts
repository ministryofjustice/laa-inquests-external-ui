import { simulation, atOnceUsers } from "@gatling.io/core";
import { http } from "@gatling.io/http";
import { applyJourneyScenario } from "../scenario/applyJourney.scenario.js";
import { resolveBaseUrl } from "../config/environment.js";

export default simulation((setUp) => {
  const httpProtocol = http.baseUrl(resolveBaseUrl());

  setUp(applyJourneyScenario.injectOpen(atOnceUsers(1))).protocols(
    httpProtocol,
  );
});
