import { strict as assert } from "assert";
import { Address } from "#src/domain/client/Address.js";

describe("Address", () => {
  it("reconstructs from persisted values", () => {
	const address = Address.fromPersisted({
	  addressLine1: "10 Downing Street",
	  addressLine2: null,
	  townOrCity: "London",
	  county: "Greater London",
	  postcode: "SW1A 2AA",
	});

	assert.notEqual(address, null);
	assert.deepEqual(address?.toPersisted(), {
	  addressLine1: "10 Downing Street",
	  addressLine2: null,
	  townOrCity: "London",
	  county: "Greater London",
	  postcode: "SW1A 2AA",
	});
  });

  it("returns null when persisted value is invalid", () => {
	const address = Address.fromPersisted({
	  addressLine1: "10 Downing Street",
	  townOrCity: "London",
	  postcode: 42,
	});

	assert.equal(address, null);
  });

  it("normalizes undefined optional fields to null", () => {
	const address = Address.fromPersisted({
	  addressLine1: "10 Downing Street",
	  townOrCity: "London",
	  postcode: "SW1A 2AA",
	});

	assert.notEqual(address, null);
	assert.deepEqual(address?.toPersisted(), {
	  addressLine1: "10 Downing Street",
	  addressLine2: null,
	  townOrCity: "London",
	  county: null,
	  postcode: "SW1A 2AA",
	});
  });
});


