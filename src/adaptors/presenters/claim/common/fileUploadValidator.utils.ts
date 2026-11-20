import {
  INVALID_FILE_NAME,
  INVALID_FILE_NAME_REGEX,
} from "#src/infrastructure/locales/constants.js";

export interface FileValidationOptions {
  allowedFileTypes: string[];
  maxFileSizeBytes: number;
  emptyFileSizeBytes: number;
  invalidFileTypeMessage: string;
  fileTooLargeMessage: string;
  fileIsEmptyMessage: string;
}

export interface UploadedFileLike {
  mimetype: string;
  originalname: string;
  size: number;
}

// Server-side mirror of the browser filename rule, which a crafted request can bypass.
export function validateUploadedFileName(
  originalname: string,
): string | undefined {
  if (!INVALID_FILE_NAME_REGEX.test(originalname)) {
    return INVALID_FILE_NAME.replace("{filename}", () => originalname);
  }
}

export function validateUploadedFile(
  fileInput: UploadedFileLike,
  options: FileValidationOptions,
): string | undefined {
  const fileNameError = validateUploadedFileName(fileInput.originalname);
  if (fileNameError !== undefined) {
    return fileNameError;
  }

  if (!options.allowedFileTypes.includes(fileInput.mimetype)) {
    return options.invalidFileTypeMessage.replace(
      "{filename}",
      () => fileInput.originalname,
    );
  }

  if (fileInput.size > options.maxFileSizeBytes) {
    return options.fileTooLargeMessage.replace(
      "{filename}",
      () => fileInput.originalname,
    );
  }

  if (fileInput.size === options.emptyFileSizeBytes) {
    return options.fileIsEmptyMessage.replace(
      "{filename}",
      () => fileInput.originalname,
    );
  }
}
