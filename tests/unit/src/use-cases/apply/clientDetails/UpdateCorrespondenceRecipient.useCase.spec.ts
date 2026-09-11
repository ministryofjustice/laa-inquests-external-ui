import { strict as assert } from "assert";
import { CORRESPONDENCE_RECIPIENT_TYPE } from "#src/infrastructure/locales/constants.js";
import { UpdateCorrespondenceRecipientUseCase } from "#src/use-cases/apply/clientDetails/UpdateCorrespondenceRecipient.useCase.js";

describe("UpdateCorrespondenceRecipientUseCase", () => {
  it("returns undefined when recipient selection is invalid", () => {
    const useCase = new UpdateCorrespondenceRecipientUseCase();

    const result = useCase.execute("INVALID", undefined, undefined);

    assert.equal(result, undefined);
  });

  it("returns null recipient when NONE is selected", () => {
    const useCase = new UpdateCorrespondenceRecipientUseCase();

    const result = useCase.execute("NONE", undefined, undefined);

    assert.deepEqual(result, {
      clientCorrespondenceRecipient: null,
    });
  });

  it("builds a person correspondence recipient when PERSON is selected", () => {
    const useCase = new UpdateCorrespondenceRecipientUseCase();

    const result = useCase.execute(
      CORRESPONDENCE_RECIPIENT_TYPE.PERSON,
      "Jane Doe",
      undefined,
    );

    assert.ok(result);
    assert.equal(
      result.clientCorrespondenceRecipient?.recipientType,
      CORRESPONDENCE_RECIPIENT_TYPE.PERSON,
    );
    assert.equal(
      result.clientCorrespondenceRecipient?.recipientName,
      "Jane Doe",
    );
  });

  it("builds an organisation correspondence recipient when organisation is selected", () => {
    const useCase = new UpdateCorrespondenceRecipientUseCase();

    const result = useCase.execute(
      CORRESPONDENCE_RECIPIENT_TYPE.ORGANISATION,
      undefined,
      "Example co.",
    );

    assert.ok(result);
    assert.equal(
      result.clientCorrespondenceRecipient?.recipientType,
      CORRESPONDENCE_RECIPIENT_TYPE.ORGANISATION,
    );
    assert.equal(
      result.clientCorrespondenceRecipient?.recipientName,
      "Example co.",
    );
  });
});
