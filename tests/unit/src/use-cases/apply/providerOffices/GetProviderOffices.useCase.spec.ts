import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { GetProviderOfficesPort } from "#src/ports/source/inquests-api/GetProviderOffices.port.js";
import { GetProviderOfficesUseCase } from "#src/use-cases/apply/providerOffices/GetProviderOffices.useCase.js";

describe("GetProviderOfficesUseCase", () => {
  let getProviderOfficesPort: StubbedInstance<GetProviderOfficesPort>;
  let useCase: GetProviderOfficesUseCase;

  beforeEach(() => {
    getProviderOfficesPort = stubInterface<GetProviderOfficesPort>();
    useCase = new GetProviderOfficesUseCase(getProviderOfficesPort);
  });

  it("returns success with provider offices when the port responds", async () => {
    const offices = [
      {
        officeCode: "0A123A",
        address: {
          addressLine1: "1 Test Street",
          addressLine2: "Suite 2",
          townOrCity: "London",
          county: "Greater London",
          postcode: "SW1A 1AA",
        },
      },
      {
        officeCode: "0A567A",
        address: {
          addressLine1: "2 Test Street",
          addressLine2: "Suite 3",
          townOrCity: "Manchester",
          county: "Greater Manchester",
          postcode: "M1A 1AA",
        },
      },
    ];
    getProviderOfficesPort.getProviderOffices.resolves(offices);

    const result = await useCase.execute("123", "access-token-123");

    assert.deepEqual(result, offices);
  });

  it("passes the firm id and access token to the port", async () => {
    getProviderOfficesPort.getProviderOffices.resolves([]);

    await useCase.execute("123", "access-token-123");

    assert(
      getProviderOfficesPort.getProviderOffices.calledOnceWithExactly(
        "123",
        "access-token-123",
      ),
    );
  });

  it("propagates the port error unchanged", async () => {
    const portError = new Error("Network error");
    getProviderOfficesPort.getProviderOffices.rejects(portError);

    await assert.rejects(
      async () => useCase.execute("123", "access-token-123"),
      (error: unknown) => {
        assert.equal(error, portError);
        return true;
      },
    );
  });
});
