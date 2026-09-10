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

  it("returns the public bodies when the port resolves", async () => {
    const publicBodies = [
      {
        publicBodyId: "Cabinet Office",
        publicBodyDescription: "Cabinet Office",
      },
    ];

    getPublicAuthoritiesPort.getPublicAuthorities.resolves(publicBodies);

    const result = await useCase.execute("access-token-123");

    assert.deepEqual(result, publicBodies);
  });

  it("propagates the port error unchanged", async () => {
    const portError = new Error("Network error");
    getPublicAuthoritiesPort.getPublicAuthorities.rejects(portError);

    await assert.rejects(
      async () => useCase.execute("access-token-123"),
      (error: unknown) => {
        assert.equal(error, portError);
        return true;
      },
    );
  });
});
