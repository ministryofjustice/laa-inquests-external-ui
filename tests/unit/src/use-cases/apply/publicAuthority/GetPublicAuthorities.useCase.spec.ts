import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { GetPublicAuthoritiesPort } from "#src/ports/source/inquests-api/GetPublicAuthorities.port.js";
import { GetPublicAuthoritiesUseCase } from "#src/use-cases/apply/publicAuthority/GetPublicAuthorities.useCase.js";

describe("GetPublicAuthoritiesUseCase", () => {
  let getPublicAuthoritiesPort: StubbedInstance<GetPublicAuthoritiesPort>;
  let useCase: GetPublicAuthoritiesUseCase;

  beforeEach(() => {
    getPublicAuthoritiesPort = stubInterface<GetPublicAuthoritiesPort>();
    useCase = new GetPublicAuthoritiesUseCase(getPublicAuthoritiesPort);
  });

  it("returns success with public bodies when API responds", async () => {
    const publicBodies = [
      {
        publicBodyId: "Cabinet Office",
        publicBodyDescription: "Cabinet Office",
      },
    ];

    getPublicAuthoritiesPort.getPublicAuthorities.resolves(publicBodies);

    const result = await useCase.execute("access-token-123");

    assert.equal(result.status, "SUCCESS");
    assert.deepEqual(result.data, publicBodies);
  });

  it("returns technical failure when API throws", async () => {
    getPublicAuthoritiesPort.getPublicAuthorities.rejects(
      new Error("Network error"),
    );

    const result = await useCase.execute("access-token-123");

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UNEXPECTED_EXCEPTION",
    });
  });
});
