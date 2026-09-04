import type {
  DeleteCoronersLetterRequest,
  DeleteCoronersLetterResponse,
} from "#src/adaptors/source/inquests-api/apply/DeleteCoronersLetter/models/DeleteCoronersLetter.types.js";

export interface DeleteCoronersLetterPort {
  deleteCoronersLetter: (
    body: DeleteCoronersLetterRequest,
    accessToken: string | undefined,
  ) => Promise<DeleteCoronersLetterResponse>;
}
