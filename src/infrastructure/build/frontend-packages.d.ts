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

  export interface MultiFileUploadInstance {
    $feedbackContainer: HTMLElement;
    $status: HTMLElement;
    getFileRow: (file: File) => HTMLElement;
    getErrorHtml: (error: Error) => string;
    // Method (not property) form is required so the subclass can override it and call super.uploadFile.
    // eslint-disable-next-line @typescript-eslint/method-signature-style -- see comment above
    uploadFile(file: File): void;
  }

  type MultiFileUploadConstructor = new (
    root: Element,
    config?: MultiFileUploadConfig,
  ) => MultiFileUploadInstance;

  export const MultiFileUpload: MultiFileUploadConstructor;
}
