import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";
import type { SaveCoronersLetterPort } from "#src/ports/source/inquests-api/SaveCoronersLetter.port.js";
import { HTTP_CREATED } from "#src/infrastructure/locales/constants.js";

interface SaveCoronersLetterInput {
  fileName: string;
}

interface SaveCoronersLetterOutput {
  status: string;
}

export class SaveCoronersLetterUseCase {
  saveCoronersLetterPort: SaveCoronersLetterPort;

  constructor(saveCoronersLetterPort: SaveCoronersLetterPort) {
    this.saveCoronersLetterPort = saveCoronersLetterPort;
  }

  async execute(
    input: SaveCoronersLetterInput,
  ): Promise<UseCaseResult<SaveCoronersLetterOutput>> {
    const { fileName } = input;

    try {
      const responseRaw = await this.saveCoronersLetterPort.saveCoronersLetter({
        coronersLetter: fileName,
      });

      const { statusCode } = responseRaw;

      if (statusCode === HTTP_CREATED) {
        return {
          status: "SUCCESS",
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
