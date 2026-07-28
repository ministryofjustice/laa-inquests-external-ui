import {
  PublicAuthorityValidator,
  PUBLIC_AUTHORITY_ERROR,
} from "#src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.validator.js";
import { assert } from "chai";

describe("PublicAuthorityValidator", () => {
  describe("validatePublicAuthorityInput", () => {
    it("returns expected error message when no public authority is selected", () => {
      const formValidator = new PublicAuthorityValidator();

      const formBody: Partial<Record<string, string>> = {
        _csrf: "abcdefg",
      };

      const errorSummaries =
        formValidator.validatePublicAuthorityInput(formBody);

      assert.deepEqual(errorSummaries, {
        noPublicAuthoritySelected: {
          text: PUBLIC_AUTHORITY_ERROR.NO_SELECTION,
        },
      });
    });
  });
});
