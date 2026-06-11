import type { Proceeding } from "#src/infrastructure/express/session/index.types.js";

export interface ProceedingsSessionState {
  selectedProceedings?: Proceeding[];
}
