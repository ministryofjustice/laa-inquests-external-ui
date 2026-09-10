import type { z } from "zod";
import type { UploadCoronersLetterRequestSchema } from "./UploadCoronersLetter.schema.js";

export type UploadCoronersLetterRequest = z.infer<
  typeof UploadCoronersLetterRequestSchema
>;

// Uploads use a value-based protocol (no ApplicationError): every non-success
// outcome is an expected result the upload widget renders inline.
export type UploadCoronersLetterResponse =
  | {
      status: "SUCCESS";
      coronersLetterId: string;
      coronersLetterFileName: string;
    }
  | { status: "FILE_SCAN_FOUND_VIRUS" }
  | { status: "UPLOAD_REJECTED" };
