import type {
  SubmitApplicationRequest,
  SubmitApplicationResponse,
} from "#src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.types.js";

export interface ApplySubmitPort {
  submitApplication: (
    body: SubmitApplicationRequest,
    accessToken: string | undefined,
  ) => Promise<SubmitApplicationResponse>;
}
