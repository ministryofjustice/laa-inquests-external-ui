import type { AxiosInstance, AxiosResponse } from "axios";
import type { DeleteEvidencePort } from "#src/ports/source/inquests-api/DeleteEvidence.port.js";
import type {
  DeleteEvidenceRequest,
  DeleteEvidenceResponse,
} from "./models/DeleteEvidence.types.js";
import { DeleteEvidenceResponseSchema } from "./models/DeleteEvidence.schema.js";
import { HTTP_NOT_FOUND } from "#src/infrastructure/locales/constants.js";
import { deleteFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";

const HTTP_NO_CONTENT = 204;

export class DeleteEvidenceAdaptor implements DeleteEvidencePort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async deleteEvidence(
    body: DeleteEvidenceRequest,
    accessToken: string | undefined,
  ): Promise<DeleteEvidenceResponse> {
    try {
      const response: AxiosResponse = await deleteFromInquestsApi({
        http: this.http,
        baseUrl: this.baseUrl,
        path: `/claims/${body.evidenceFileId}`,
        accessToken,
      });

      if (response.status !== HTTP_NO_CONTENT) {
        return {
          status: "TECHNICAL_FAILURE",
          reason:
            response.status === HTTP_NOT_FOUND
              ? "INVALID_INPUT_STATE"
              : "UPSTREAM_REJECTED",
        };
      }

      const parsedResponse = DeleteEvidenceResponseSchema.safeParse({
        status: "SUCCESS",
      });

      if (!parsedResponse.success) {
        return {
          status: "TECHNICAL_FAILURE",
          reason: "UNEXPECTED_EXCEPTION",
        };
      }

      return {
        status: "SUCCESS",
      };
    } catch {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
  }
}
