import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { GetPublicBodiesPort } from "#src/ports/source/inquests-api/GetPublicBodies.port.js";
import { GetPublicBodiesUseCase } from "#src/use-cases/apply/publicAuthority/GetPublicBodies.useCase.js";

describe("GetPublicBodiesUseCase", () => {
  let getPublicBodiesPort: StubbedInstance<GetPublicBodiesPort>;
  let useCase: GetPublicBodiesUseCase;

  beforeEach(() => {
    getPublicBodiesPort = stubInterface<GetPublicBodiesPort>();
    useCase = new GetPublicBodiesUseCase(getPublicBodiesPort);
  });

  it("returns success with public bodies when API responds", async () => {
    const publicBodies = [
      {
        publicBodyId: "Cabinet Office",
        publicBodyDescription: "Cabinet Office",
      },
    ];

    getPublicBodiesPort.getPublicBodies.resolves(publicBodies);

    const result = await useCase.execute("access-token-123");

    assert.equal(result.status, "SUCCESS");
    assert.deepEqual(result.data, publicBodies);
  });

  it("returns technical failure when API throws", async () => {
    getPublicBodiesPort.getPublicBodies.rejects(new Error("Network error"));

    const result = await useCase.execute("access-token-123");

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UNEXPECTED_EXCEPTION",
    });
  });
});
