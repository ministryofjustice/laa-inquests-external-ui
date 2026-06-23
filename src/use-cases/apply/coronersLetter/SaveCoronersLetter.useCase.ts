import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";
import type { SaveCoronersLetterPort } from "#src/ports/source/inquests-api/SaveCoronersLetter.port.js";

interface SaveCoronersLetterInput {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

interface SaveCoronersLetterOutput {
  fileId: string;
}

export class SaveCoronersLetterUseCase {
  saveCoronersLetterPort: SaveCoronersLetterPort;

  constructor(saveCoronersLetterPort: SaveCoronersLetterPort) {
    this.saveCoronersLetterPort = saveCoronersLetterPort;
  }

  async execute(
    input: SaveCoronersLetterInput,
  ): Promise<UseCaseResult<SaveCoronersLetterOutput>> {
    const { buffer, mimetype, originalname } = input;

    try {
      const responseRaw = await this.saveCoronersLetterPort.saveCoronersLetter({
        buffer,
        mimetype,
        originalname,
      });

      const { status } = responseRaw;

      if (status === "SUCCESS") {
        return {
          status: "SUCCESS",
          data: { fileId: responseRaw.fileId },
        };
      }

      return {
        status: "TECHNICAL_FAILURE",
        reason: "UPSTREAM_REJECTED",
      };
    } catch {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
  }
}
