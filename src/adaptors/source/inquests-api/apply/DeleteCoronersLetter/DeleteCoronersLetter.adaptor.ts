import type { AxiosInstance, AxiosResponse } from "axios";
import type { DeleteCoronersLetterPort } from "#src/ports/source/inquests-api/DeleteCoronersLetter.port.js";
import type {
  DeleteCoronersLetterRequest,
  DeleteCoronersLetterResponse,
} from "./models/DeleteCoronersLetter.types.js";
import { DeleteCoronersLetterResponseSchema } from "./models/DeleteCoronersLetter.schema.js";
import { HTTP_NOT_FOUND } from "#src/infrastructure/locales/constants.js";
import { deleteFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";

const HTTP_NO_CONTENT = 204;

export class DeleteCoronersLetterAdaptor implements DeleteCoronersLetterPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async deleteCoronersLetter(
    body: DeleteCoronersLetterRequest,
    accessToken: string | undefined,
  ): Promise<DeleteCoronersLetterResponse> {
    try {
      const response: AxiosResponse = await deleteFromInquestsApi({
        http: this.http,
        baseUrl: this.baseUrl,
        path: `/applications/coroners-letter/${body.coronersLetterId}`,
        accessToken,
      });

      if (response.status !== HTTP_NO_CONTENT) {
        const reason =
          response.status === HTTP_NOT_FOUND
            ? "INVALID_INPUT_STATE"
            : "UPSTREAM_REJECTED";
        logger.logWarn({
          functionName: "deleteCoronersLetterAdaptor_deleteCoronersLetter",
          message: "Delete coroners letter request rejected by upstream service",
          extraContext: {
            event: "apply_coroners_letter_delete_failed",
            reason,
            status_code: response.status,
            file_id: body.coronersLetterId,
          },
        });
        return {
          status: "TECHNICAL_FAILURE",
          reason,
        };
      }

      const parsedResponse = DeleteCoronersLetterResponseSchema.safeParse({
        status: "SUCCESS",
      });

      if (!parsedResponse.success) {
        logger.logError({
          functionName: "deleteCoronersLetterAdaptor_deleteCoronersLetter",
          message: "Delete coroners letter returned invalid success payload",
          extraContext: {
            event: "apply_coroners_letter_delete_failed",
            reason: "UNEXPECTED_EXCEPTION",
            issues: parsedResponse.error.issues,
            file_id: body.coronersLetterId,
          },
        });
        return {
          status: "TECHNICAL_FAILURE",
          reason: "UNEXPECTED_EXCEPTION",
        };
      }

      logger.logInfo({
        functionName: "deleteCoronersLetterAdaptor_deleteCoronersLetter",
        message: "Delete coroners letter completed successfully",
        extraContext: {
          event: "apply_coroners_letter_delete_completed",
          outcome: "SUCCESS",
          file_id: body.coronersLetterId,
        },
      });

      return {
        status: "SUCCESS",
      };
    } catch (err) {
      logger.logError({
        functionName: "deleteCoronersLetterAdaptor_deleteCoronersLetter",
        message: "Delete coroners letter failed with exception",
        err,
        extraContext: {
          event: "apply_coroners_letter_delete_failed",
          reason: "UNEXPECTED_EXCEPTION",
          file_id: body.coronersLetterId,
        },
      });
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
  }
}
