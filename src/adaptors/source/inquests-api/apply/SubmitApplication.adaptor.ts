import type {
  ApplySubmitPort,
  SubmitApplicationRequest,
  SubmitApplicationResponse,
} from "#src/ports/source/inquests-api/SubmitApplication.port.js";

export class SubmitApplicationDomain implements ApplySubmitPort {
  // eslint-disable-next-line @typescript-eslint/require-await -- Temp disable
  async submitApplication(
    _body: SubmitApplicationRequest,
  ): Promise<SubmitApplicationResponse> {
    throw new Error("submitApplication not implemented");
  }
}
