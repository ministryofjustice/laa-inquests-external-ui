export interface PersistedAddress {
  addressLine1: string;
  addressLine2: string | null;
  townOrCity: string;
  county: string | null;
  postcode: string;
}

export class Address {
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly townOrCity: string;
  readonly county: string | null;
  readonly postcode: string;

  private constructor(props: PersistedAddress) {
	this.addressLine1 = props.addressLine1;
	this.addressLine2 = props.addressLine2;
	this.townOrCity = props.townOrCity;
	this.county = props.county;
	this.postcode = props.postcode;
  }

  static fromPersisted(value: unknown): Address | null {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
	  return null;
	}

	const candidate = value as Partial<PersistedAddress>;

	if (
	  typeof candidate.addressLine1 !== "string" ||
	  typeof candidate.townOrCity !== "string" ||
	  typeof candidate.postcode !== "string"
	) {
	  return null;
	}

	if (
	  candidate.addressLine2 !== undefined &&
	  candidate.addressLine2 !== null &&
	  typeof candidate.addressLine2 !== "string"
	) {
	  return null;
	}

	if (
	  candidate.county !== undefined &&
	  candidate.county !== null &&
	  typeof candidate.county !== "string"
	) {
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

  toPersisted(): PersistedAddress {
	return {
	  addressLine1: this.addressLine1,
	  addressLine2: this.addressLine2,
	  townOrCity: this.townOrCity,
	  county: this.county,
	  postcode: this.postcode,
	};
  }

}


