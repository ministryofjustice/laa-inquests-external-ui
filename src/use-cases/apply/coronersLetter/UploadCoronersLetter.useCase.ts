import type { UploadCoronersLetterPort } from "#src/ports/source/inquests-api/UploadCoronersLetter.port.js";
import type { UploadCoronersLetterResponse } from "#src/adaptors/source/inquests-api/apply/UploadCoronersLetter/models/UploadCoronersLetter.types.js";

interface UploadCoronersLetterInput {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  accessToken?: string;
}

export class UploadCoronersLetterUseCase {
  uploadCoronersLetterPort: UploadCoronersLetterPort;

  constructor(uploadCoronersLetterPort: UploadCoronersLetterPort) {
    this.uploadCoronersLetterPort = uploadCoronersLetterPort;
  }

  async execute(
    input: UploadCoronersLetterInput,
  ): Promise<UploadCoronersLetterResponse> {
    const { buffer, mimetype, originalname, accessToken } = input;

    return await this.uploadCoronersLetterPort.uploadCoronersLetter(
      { buffer, mimetype, originalname },
      accessToken,
    );
  }
}
