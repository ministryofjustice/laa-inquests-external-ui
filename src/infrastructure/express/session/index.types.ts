declare module "express-session" {
  interface SessionData extends Record<
    string,
    Record<string, string> | string | boolean | undefined | null
  > {
    // This allows both specific properties and dynamic namespace access
    error: FormError;
    selectedProceedings?: Proceeding[];
  }
}

interface FormError {
  message?: string;
}

export interface Proceeding {
  proceedingId: string;
  proceedingDescription: string;
  matterType: string;
}
