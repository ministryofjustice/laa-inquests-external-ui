import { strict as assert } from "assert";
import { PreCertificateCostsValidator } from "#src/adaptors/presenters/claim/PreCertificateCosts/PreCertificateCosts.validator.js";
import { PRE_CERTIFICATE_COSTS_ERROR } from "#src/infrastructure/locales/constants.js";

describe("PreCertificateCosts validator", () => {
  describe("validatePreCertificateCosts", () => {
    it("returns a missing error when the field is blank", () => {
      const validator = new PreCertificateCostsValidator();

      const errors = validator.validatePreCertificateCosts({});

      assert.deepEqual(errors, {
        preCertificateCostsInputError: {
          text: PRE_CERTIFICATE_COSTS_ERROR.MISSING,
        },
      });
    });

    it("returns a missing error when the field is only whitespace", () => {
      const validator = new PreCertificateCostsValidator();

      const errors = validator.validatePreCertificateCosts({
        "pre-certificate-costs": "   ",
      });

      assert.deepEqual(errors, {
        preCertificateCostsInputError: {
          text: PRE_CERTIFICATE_COSTS_ERROR.MISSING,
        },
      });
    });

    it("returns an invalid error when the field is not a valid amount", () => {
      const validator = new PreCertificateCostsValidator();

      const errors = validator.validatePreCertificateCosts({
        "pre-certificate-costs": "abc",
      });

      assert.deepEqual(errors, {
        preCertificateCostsInputError: {
          text: PRE_CERTIFICATE_COSTS_ERROR.INVALID,
        },
      });
    });

    it("returns an invalid error when the field has more than two decimal places", () => {
      const validator = new PreCertificateCostsValidator();

      const errors = validator.validatePreCertificateCosts({
        "pre-certificate-costs": "100.123",
      });

      assert.deepEqual(errors, {
        preCertificateCostsInputError: {
          text: PRE_CERTIFICATE_COSTS_ERROR.INVALID,
        },
      });
    });

    it("returns no errors when the field is a valid amount", () => {
      const validator = new PreCertificateCostsValidator();

      const errors = validator.validatePreCertificateCosts({
        "pre-certificate-costs": "400.50",
      });

      assert.deepEqual(errors, {});
    });
  });
});
