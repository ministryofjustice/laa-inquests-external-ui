import type { ApplySubmitPort } from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import {
  isAxiosError,
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
} from "axios";
import type {
  SubmitApplicationRequest,
  SubmitApplicationResponse,
} from "./models/SubmitApplication.types.js";
import { UpstreamHttpError } from "#src/use-cases/common/upstreamHttpError.js";

const HTTP_INTERNAL_SERVER_ERROR = 500;
let mockSubmitStatus: number | null = null;

export function setMockSubmitStatus(status: number): void {
  mockSubmitStatus = status;
}

export function resetMockSubmitStatus(): void {
  mockSubmitStatus = null;
}

function getHttpStatusCode(error: AxiosError): number {
  if (typeof error.response?.status === "number") {
    return error.response.status;
  }

  return HTTP_INTERNAL_SERVER_ERROR;
}

export class SubmitApplicationAdaptor implements ApplySubmitPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
    private readonly payloadDebugEnabled = false,
    private readonly logger: (message: string) => void = () => undefined,
  ) {}

  async submitApplication(
    _body: SubmitApplicationRequest,
  ): Promise<SubmitApplicationResponse> {
    if (process.env.NODE_ENV === "test" && mockSubmitStatus !== null) {
      throw new UpstreamHttpError(
        mockSubmitStatus,
        `Mock submit failed with status ${mockSubmitStatus}`,
      );
    }

    if (this.payloadDebugEnabled) {
      this.logger(
        JSON.stringify({ event: "submit.application.payload", payload: _body }),
      );
    }

    try {
      const response: AxiosResponse<SubmitApplicationResponse> =
        await this.http.post(`${this.baseUrl}/applications`, _body);

      const submitApplicationResponse: SubmitApplicationResponse = {
        statusCode: response.status,
        laaReference: response.data.laaReference,
      };
      return submitApplicationResponse;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const statusCode = getHttpStatusCode(error);
        throw new UpstreamHttpError(statusCode, error.message, error);
      }

      throw new UpstreamHttpError(
        HTTP_INTERNAL_SERVER_ERROR,
        "Unexpected upstream request error",
        error,
      );
    }
  }
}
