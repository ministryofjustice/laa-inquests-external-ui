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
  size: number;
}

export function validateUploadedFile(
  fileInput: UploadedFileLike,
  options: FileValidationOptions,
): string | undefined {
  if (!options.allowedFileTypes.includes(fileInput.mimetype)) {
    return options.invalidFileTypeMessage;
  }

  if (fileInput.size > options.maxFileSizeBytes) {
    return options.fileTooLargeMessage;
  }

  if (fileInput.size === options.emptyFileSizeBytes) {
    return options.fileIsEmptyMessage;
  }
}
