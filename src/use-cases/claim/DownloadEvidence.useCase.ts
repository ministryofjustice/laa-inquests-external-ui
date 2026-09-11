import type { DownloadEvidencePort } from "#src/ports/source/inquests-api/DownloadEvidence.port.js";
import type {
  DownloadEvidenceResponse,
  EvidenceDisposition,
} from "#src/adaptors/source/inquests-api/claim/DownloadEvidence/models/DownloadEvidence.types.js";

interface DownloadEvidenceInput {
  claimEvidenceId: string;
  disposition: EvidenceDisposition;
  accessToken?: string;
}

export class DownloadEvidenceUseCase {
  downloadEvidencePort: DownloadEvidencePort;

  constructor(downloadEvidencePort: DownloadEvidencePort) {
    this.downloadEvidencePort = downloadEvidencePort;
  }

  async execute(
    input: DownloadEvidenceInput,
  ): Promise<DownloadEvidenceResponse> {
    return await this.downloadEvidencePort.downloadEvidence(
      {
        claimEvidenceId: input.claimEvidenceId,
        disposition: input.disposition,
      },
      input.accessToken,
    );
  }
}
