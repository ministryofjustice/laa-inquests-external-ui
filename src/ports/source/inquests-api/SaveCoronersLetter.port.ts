import type {
  SaveCoronersLetterRequest,
  SaveCoronersLetterResponse,
} from "#src/adaptors/source/inquests-api/apply/SaveCoronersLetter/models/SaveCoronersLetter.types.js";

export interface SaveCoronersLetterPort {
  saveCoronersLetter: (
    body: SaveCoronersLetterRequest,
  ) => Promise<SaveCoronersLetterResponse>;
}
