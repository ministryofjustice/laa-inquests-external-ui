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
    $root: Element;
    $feedbackContainer: HTMLElement;
    $status: HTMLElement;
    config: MultiFileUploadConfig;
    // Method (not property) form is required so the subclass can override these and call super.
    /* eslint-disable @typescript-eslint/method-signature-style -- see comment above */
    getFileRow(file: File): HTMLElement;
    getErrorHtml(error: Error): string;
    getSuccessHtml(success: UploadResponseSuccess): string;
    getDeleteButton(file: UploadResponseFile): HTMLElement;
    uploadFiles(files: FileList): void;
    uploadFile(file: File): void;
    /* eslint-enable @typescript-eslint/method-signature-style */
  }

  export interface UploadResponseSuccess {
    messageText: string;
    messageHtml: string;
  }

  export interface UploadResponseFile {
    filename: string;
    originalname: string;
  }

  type MultiFileUploadConstructor = new (
    root: Element,
    config?: MultiFileUploadConfig,
  ) => MultiFileUploadInstance;

  export const MultiFileUpload: MultiFileUploadConstructor;
}
