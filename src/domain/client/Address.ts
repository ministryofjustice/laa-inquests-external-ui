export interface AddressFields {
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

  constructor(fields: AddressFields) {
    const { addressLine1, addressLine2, townOrCity, county, postcode } = fields;
    this.addressLine1 = addressLine1;
    this.addressLine2 = addressLine2;
    this.townOrCity = townOrCity;
    this.county = county;
    this.postcode = postcode;
  }
}
