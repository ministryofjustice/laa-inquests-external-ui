/**
 * Type declarations for frontend packages that don't have built-in TypeScript support.
 */

declare module "govuk-frontend" {
  export function initAll(): void;
}

declare module "@ministryofjustice/frontend" {
  export function initAll(): void;
}
declare module "@ministryofjustice/frontend/moj/components/multi-file-upload/multi-file-upload.mjs" {
  export interface MultiFileUploadConfig {
    uploadUrl: string;
    deleteUrl: string;
  }

  type MultiFileUploadInstance = object;

  type MultiFileUploadConstructor = new (
    root: Element,
    config?: MultiFileUploadConfig,
  ) => MultiFileUploadInstance;

  export const MultiFileUpload: MultiFileUploadConstructor;
}
