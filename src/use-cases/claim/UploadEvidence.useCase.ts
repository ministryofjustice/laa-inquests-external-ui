import type { UploadEvidencePort } from "#src/ports/source/inquests-api/UploadEvidence.port.js";
import type { UploadEvidenceResponse } from "#src/adaptors/source/inquests-api/claim/UploadEvidence/models/UploadEvidence.types.js";

interface UploadEvidenceInput {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  accessToken?: string;
}

export class UploadEvidenceUseCase {
  uploadEvidencePort: UploadEvidencePort;

  constructor(uploadEvidencePort: UploadEvidencePort) {
    this.uploadEvidencePort = uploadEvidencePort;
  }

  async execute(input: UploadEvidenceInput): Promise<UploadEvidenceResponse> {
    const { buffer, mimetype, originalname, accessToken } = input;

    return await this.uploadEvidencePort.uploadEvidence(
      { buffer, mimetype, originalname },
      accessToken,
    );
  }
}
