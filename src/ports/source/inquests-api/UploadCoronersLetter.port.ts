import type {
  UploadCoronersLetterRequest,
  UploadCoronersLetterResponse,
} from "#src/adaptors/source/inquests-api/apply/UploadCoronersLetter/models/UploadCoronersLetter.types.js";

export interface UploadCoronersLetterPort {
  uploadCoronersLetter: (
    body: UploadCoronersLetterRequest,
    accessToken: string | undefined,
  ) => Promise<UploadCoronersLetterResponse>;
}
