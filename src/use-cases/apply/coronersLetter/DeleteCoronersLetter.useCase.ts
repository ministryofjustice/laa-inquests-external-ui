import type { DeleteCoronersLetterPort } from "#src/ports/source/inquests-api/DeleteCoronersLetter.port.js";
import type { DeleteCoronersLetterResponse } from "#src/adaptors/source/inquests-api/apply/DeleteCoronersLetter/models/DeleteCoronersLetter.types.js";

interface DeleteCoronersLetterInput {
  coronersLetterId: string;
  accessToken?: string;
}

export class DeleteCoronersLetterUseCase {
  deleteCoronersLetterPort: DeleteCoronersLetterPort;

  constructor(deleteCoronersLetterPort: DeleteCoronersLetterPort) {
    this.deleteCoronersLetterPort = deleteCoronersLetterPort;
  }

  async execute(
    input: DeleteCoronersLetterInput,
  ): Promise<DeleteCoronersLetterResponse> {
    const { coronersLetterId, accessToken } = input;

    if (coronersLetterId === "") {
      return { status: "DELETE_REJECTED" };
    }

    return await this.deleteCoronersLetterPort.deleteCoronersLetter(
      { coronersLetterId },
      accessToken,
    );
  }
}
