export interface PersistedAddress {
  addressLine1: string;
  addressLine2: string | null;
  townOrCity: string;
  county: string | null;
  postcode: string;
}

interface AddressFormFields {
  addressLine1?: string;
  addressLine2?: string;
  townOrCity?: string;
  county?: string;
  postcode?: string;
}

export class Address {
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly townOrCity: string;
  readonly county: string | null;
  readonly postcode: string;

  private constructor(props: PersistedAddress) {
	const { addressLine1, addressLine2, townOrCity, county, postcode } = props;
	this.addressLine1 = addressLine1;
	this.addressLine2 = addressLine2;
	this.townOrCity = townOrCity;
	this.county = county;
	this.postcode = postcode;
  }

  static fromPersisted(value: unknown): Address | null {
	if (!Address.#isPersistedObjectCandidate(value)) {
	  return null;
	}

	const candidate = value;

	if (
	  typeof candidate.addressLine1 !== "string" ||
	  typeof candidate.townOrCity !== "string" ||
	  typeof candidate.postcode !== "string"
	) {
	  return null;
	}

	if (!Address.#isOptionalString(candidate.addressLine2)) {
	  return null;
	}

	if (!Address.#isOptionalString(candidate.county)) {
	  return null;
	}

	return new Address({
	  addressLine1: candidate.addressLine1,
	  addressLine2: candidate.addressLine2 ?? null,
	  townOrCity: candidate.townOrCity,
	  county: candidate.county ?? null,
	  postcode: candidate.postcode,
	});
  }

  static fromFormFields(fields: AddressFormFields): Address {
	return new Address({
	  addressLine1: fields.addressLine1 ?? "",
	  addressLine2: Address.#normalizeOptionalField(fields.addressLine2),
	  townOrCity: fields.townOrCity ?? "",
	  county: Address.#normalizeOptionalField(fields.county),
	  postcode: fields.postcode ?? "",
	});
  }

  toPersisted(): PersistedAddress {
	return {
	  addressLine1: this.addressLine1,
	  addressLine2: this.addressLine2,
	  townOrCity: this.townOrCity,
	  county: this.county,
	  postcode: this.postcode,
	};
  }

  static #normalizeOptionalField(value: string | undefined): string | null {
	return typeof value === "string" && value !== "" ? value : null;
  }

  static #isPersistedObjectCandidate(
	value: unknown,
  ): value is Partial<PersistedAddress> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  static #isOptionalString(value: unknown): value is string | null | undefined {
	return value === undefined || value === null || typeof value === "string";
  }
}
