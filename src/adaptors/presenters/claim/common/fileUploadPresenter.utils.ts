export interface JsonUploadErrorResponse {
  error: { message: string };
  file: {
    filename: string;
    originalname: string;
  };
}

export function isHtmlUploadMode(
  uploadMode: string | string[] | undefined,
): boolean {
  return (
    uploadMode === "html" ||
    (Array.isArray(uploadMode) && uploadMode.includes("html"))
  );
}

export function extractFileId(body: {
  delete?: string | string[];
  fileName?: string | string[];
  filename?: string | string[];
}): string | undefined {
  const candidate = body.delete ?? body.fileName ?? body.filename;
  if (Array.isArray(candidate)) {
    return candidate.find((value) => typeof value === "string" && value !== "");
  }
  return candidate;
}

export function isNonEmptyString(value: string | undefined): boolean {
  return typeof value === "string" && value !== "";
}

export function buildJsonUploadErrorResponse(
  message: string,
  originalname: string | undefined,
): JsonUploadErrorResponse {
  return {
    error: { message },
    file: {
      filename: "",
      originalname: originalname ?? "",
    },
  };
}

export function resolveUploadFailureMessage(
  result: { status: string; reason?: string },
  virusErrorMessage: string,
  defaultMessage: string,
): string {
  return result.status === "TECHNICAL_FAILURE" &&
    result.reason === "FILE_SCAN_FOUND_VIRUS"
    ? virusErrorMessage
    : defaultMessage;
}
