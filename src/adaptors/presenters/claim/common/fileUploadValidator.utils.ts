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

export function validateUploadedFile(
  fileInput: UploadedFileLike,
  options: FileValidationOptions,
): string | undefined {
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
