import type { Readable } from "node:stream";
import type { DownloadEvidencePort } from "#src/ports/source/inquests-api/DownloadEvidence.port.js";
import type { EvidenceDisposition } from "#src/adaptors/source/inquests-api/claim/DownloadEvidence/models/DownloadEvidence.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";

interface DownloadEvidenceInput {
  claimEvidenceId: string;
  disposition: EvidenceDisposition;
  accessToken?: string;
}

interface DownloadEvidenceOutput {
  stream: Readable;
  contentType: string;
  contentDisposition: string;
}

export class DownloadEvidenceUseCase {
  downloadEvidencePort: DownloadEvidencePort;

  constructor(downloadEvidencePort: DownloadEvidencePort) {
    this.downloadEvidencePort = downloadEvidencePort;
  }

  async execute(
    input: DownloadEvidenceInput,
  ): Promise<UseCaseResult<DownloadEvidenceOutput>> {
    const result = await this.downloadEvidencePort.downloadEvidence(
      {
        claimEvidenceId: input.claimEvidenceId,
        disposition: input.disposition,
      },
      input.accessToken,
    );

    if (result.status === "SUCCESS") {
      logger.logInfo({
        functionName: "downloadEvidenceUseCase_execute",
        message: "Evidence download prepared successfully",
        extraContext: {
          event: "claim_evidence_download_completed",
          outcome: "SUCCESS",
          file_id: input.claimEvidenceId,
          disposition: input.disposition,
        },
      });
      return {
        status: "SUCCESS",
        data: {
          stream: result.stream,
          contentType: result.contentType,
          contentDisposition: result.contentDisposition,
        },
      };
    }

    logger.logWarn({
      functionName: "downloadEvidenceUseCase_execute",
      message: "Evidence download failed",
      extraContext: {
        event: "claim_evidence_download_failed",
        reason: result.reason,
        file_id: input.claimEvidenceId,
        disposition: input.disposition,
      },
    });

    return { status: "TECHNICAL_FAILURE", reason: result.reason };
  }
}
