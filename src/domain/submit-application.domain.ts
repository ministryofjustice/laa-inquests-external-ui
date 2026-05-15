import type {
  ApplySubmitPort,
  SubmitApplicationRequest,
  SubmitApplicationResponse,
} from "#src/ports/source/apply-submit.js";

export class SubmitApplicationDomain implements ApplySubmitPort {
  async submitApplication(
    _body: SubmitApplicationRequest,
  ): Promise<SubmitApplicationResponse> {
    throw new Error("submitApplication not implemented");
  }
}