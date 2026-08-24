export interface FileValidationOptions {
  allowedFileTypes: string[];
  maxFileSizeBytes: number;
  emptyFileSizeBytes: number;
  invalidFileTypeMessage: string;
  fileTooLargeMessage: string;
  fileIsEmptyMessage: string;
}

export function validateUploadedFile(
  fileInput: Express.Multer.File,
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
