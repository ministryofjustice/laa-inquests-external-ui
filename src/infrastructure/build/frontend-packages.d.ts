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
  export interface MultiFileUploadHooks {
    entryHook?: (upload: MultiFileUploadInstance, file: File) => void;
    exitHook?: (
      upload: MultiFileUploadInstance,
      file: File,
      xhr: XMLHttpRequest,
      textStatus: string,
    ) => void;
    errorHook?: (
      upload: MultiFileUploadInstance,
      file: File,
      xhr: XMLHttpRequest,
      textStatus: string,
      errorThrown: Error,
    ) => void;
    deleteHook?: (
      upload: MultiFileUploadInstance,
      file: File | undefined,
      xhr: XMLHttpRequest,
      textStatus: string,
    ) => void;
  }

  export interface MultiFileUploadConfig {
    uploadUrl: string;
    deleteUrl: string;
    hooks?: MultiFileUploadHooks;
  }

  export type MultiFileUploadInstance = object;

  type MultiFileUploadConstructor = new (
    root: Element,
    config?: MultiFileUploadConfig,
  ) => MultiFileUploadInstance;

  export const MultiFileUpload: MultiFileUploadConstructor;
}
