import { strict as assert } from "assert";
import { CORRESPONDENCE_RECIPIENT_TYPE } from "#src/infrastructure/locales/constants.js";
import { UpdateCorrespondenceRecipientUseCase } from "#src/use-cases/apply/clientDetails/UpdateCorrespondenceRecipient.useCase.js";

describe("UpdateCorrespondenceRecipientUseCase", () => {
  it("returns technical failure when recipient selection is invalid", () => {
    const useCase = new UpdateCorrespondenceRecipientUseCase();

    const result = useCase.execute("INVALID", undefined, undefined);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "INVALID_INPUT_STATE",
    });
  });

  it("returns null recipient when NONE is selected", () => {
    const useCase = new UpdateCorrespondenceRecipientUseCase();

    const result = useCase.execute("NONE", undefined, undefined);

    assert.deepEqual(result, {
      status: "SUCCESS",
      data: {
        clientCorrespondenceRecipient: null,
      },
    });
  });

  it("builds a person correspondence recipient when PERSON is selected", () => {
    const useCase = new UpdateCorrespondenceRecipientUseCase();

    const result = useCase.execute(
      CORRESPONDENCE_RECIPIENT_TYPE.PERSON,
      "Jane Doe",
      undefined,
    );

    assert.equal(result.status, "SUCCESS");

    if (result.status === "SUCCESS") {
      assert.ok(result.data);
      assert.equal(
        result.data.clientCorrespondenceRecipient?.recipientType,
        CORRESPONDENCE_RECIPIENT_TYPE.PERSON,
      );
      assert.equal(
        result.data.clientCorrespondenceRecipient?.recipientName,
        "Jane Doe",
      );
    }
  });

  it("builds an orgainisation correspondence recipient when organisation is selected", () => {
    const useCase = new UpdateCorrespondenceRecipientUseCase();

    const result = useCase.execute(
      CORRESPONDENCE_RECIPIENT_TYPE.ORGANISATION,
      undefined,
      "Example co.",
    );

    assert.equal(result.status, "SUCCESS");

    if (result.status === "SUCCESS") {
      assert.ok(result.data);
      assert.equal(
        result.data.clientCorrespondenceRecipient?.recipientType,
        CORRESPONDENCE_RECIPIENT_TYPE.ORGANISATION,
      );
      assert.equal(
        result.data.clientCorrespondenceRecipient?.recipientName,
        "Example co.",
      );
    }
  });
});
