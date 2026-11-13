import {
  CORONERS_LETTER_ERROR,
  CORONERS_LETTER_MAX_FILE_SIZE_BYTES,
  HTTP_CREATED,
  INVALID_FILE_NAME,
  INVALID_FILE_NAME_REGEX,
} from "#src/infrastructure/locales/constants.js";

const FIRST_FILE_INDEX = 0;
const ERROR_TITLE_PREFIX = "Error: ";

function validateFileSize(file: File): string | undefined {
  if (file.size > CORONERS_LETTER_MAX_FILE_SIZE_BYTES) {
    return CORONERS_LETTER_ERROR.FILE_TOO_LARGE.replace(
      "{filename}",
      () => file.name,
    );
  }
  return undefined;
}

function validateFileName(file: File): string | undefined {
  if (!INVALID_FILE_NAME_REGEX.test(file.name)) {
    return INVALID_FILE_NAME.replace("{filename}", () => file.name);
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

interface UploadedFileResponse {
  file: { filename: string; originalname: string };
}

function isSuccessfulUpload(value: unknown): value is UploadedFileResponse {
  return (
    isRecord(value) &&
    isRecord(value.file) &&
    typeof value.file.filename === "string" &&
    value.file.filename !== "" &&
    typeof value.file.originalname === "string" &&
    value.file.originalname !== ""
  );
}

function getUploadError(value: unknown, fallback: string): string {
  if (
    isRecord(value) &&
    isRecord(value.error) &&
    typeof value.error.message === "string"
  ) {
    return value.error.message;
  } else {
    return fallback;
  }
}

function getUploadedFileControls():
  | {
      uploadedFile: HTMLElement;
      fileName: HTMLElement;
      deleteButton: HTMLButtonElement;
    }
  | undefined {
  const uploadedFile = document.querySelector<HTMLElement>(
    '[data-testid="uploaded-coroners-letter"]',
  );
  if (uploadedFile === null) {
    return undefined;
  }
  const fileName = uploadedFile.querySelector<HTMLElement>(
    "[data-uploaded-filename]",
  );
  const deleteButton = uploadedFile.querySelector<HTMLButtonElement>(
    'button[name="delete"]',
  );
  if (fileName === null || deleteButton === null) {
    return undefined;
  }
  return { uploadedFile, fileName, deleteButton };
}

function separateUploadControlText(control: HTMLButtonElement | null): void {
  // Match the visible text spacing to the component's accessible name.
  control
    ?.querySelector(".govuk-file-upload-button__status")
    ?.insertAdjacentText("afterend", " ");
}

export function initialiseCoronersLetterUpload(): void {
  const form = document.querySelector<HTMLFormElement>(
    '[data-module="coroners-letter-upload"]',
  );
  if (form === null) {
    return;
  }
  const input = form.querySelector<HTMLInputElement>(
    'input[type="file"][name="documents"]',
  );
  const token = form.querySelector<HTMLInputElement>('input[name="_csrf"]');
  const uploadButton = form.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  );
  const continueForm = document.querySelector<HTMLFormElement>(
    '[data-testid="upload-coroners-letter-form"]',
  );
  if (continueForm === null) {
    return;
  }
  const continueButton = continueForm.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  );
  const uploadedFileControls = getUploadedFileControls();
  if (uploadedFileControls === undefined) {
    return;
  }
  const { uploadedFile, fileName, deleteButton } = uploadedFileControls;

  if (
    input === null ||
    token === null ||
    uploadButton === null ||
    continueButton === null
  ) {
    return;
  }

  const state = { pending: false };
  const group = input.closest(".govuk-form-group");
  const control = form.querySelector<HTMLButtonElement>("#documents");
  separateUploadControlText(control);
  const failureMessage = form.dataset.failureMessage!;

  function setPending(pending: boolean): void {
    state.pending = pending;
    continueButton!.disabled = pending;
    input!.disabled = pending || !uploadedFile.hasAttribute("hidden");
    deleteButton.disabled = pending;
  }

  function showSuccess(file: UploadedFileResponse["file"]): void {
    const { originalname, filename } = file;
    fileName.textContent = originalname;
    deleteButton.value = filename;
    deleteButton.setAttribute(
      "aria-label",
      `${deleteButton.textContent.trim()} ${file.originalname}`,
    );
    uploadedFile.hidden = false;
    document.querySelector(".govuk-error-summary")?.remove();
    document.getElementById("documents-error")?.remove();
    group?.classList.remove("govuk-form-group--error");
    input!.classList.remove("govuk-file-upload--error");
    input!.removeAttribute("aria-describedby");
    control?.removeAttribute("aria-describedby");
    if (document.title.startsWith(ERROR_TITLE_PREFIX)) {
      document.title = document.title.slice(ERROR_TITLE_PREFIX.length);
    }
  }

  function showError(message: string): void {
    let error = document.getElementById("documents-error");
    if (error === null) {
      error = document.createElement("p");
      error.id = "documents-error";
      error.className = "govuk-error-message";
      group?.append(error);
    }
    error.textContent = message;
    group?.classList.add("govuk-form-group--error");
    input!.setAttribute("aria-describedby", "documents-error");
    control?.setAttribute("aria-describedby", "documents-error");
  }

  async function uploadFile(): Promise<void> {
    const file = input!.files?.item(FIRST_FILE_INDEX);
    if (state.pending || file === undefined || file === null) {
      return;
    }

    const validationError = validateFileSize(file) ?? validateFileName(file);
    if (validationError !== undefined) {
      showError(validationError);
      return;
    }

    setPending(true);
    const body = new FormData();
    body.append("documents", file);

    try {
      const response = await fetch(form!.action, {
        method: "POST",
        headers: { "x-csrf-token": token!.value },
        body,
      });
      const result: unknown = await response.json();
      if (response.status === HTTP_CREATED && isSuccessfulUpload(result)) {
        showSuccess(result.file);
      } else {
        showError(getUploadError(result, failureMessage));
      }
    } catch {
      showError(failureMessage);
    } finally {
      setPending(false);
    }
  }

  input.addEventListener("change", () => {
    void uploadFile();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void uploadFile();
  });
  continueForm.addEventListener("submit", (event) => {
    if (state.pending) {
      event.preventDefault();
    }
  });
  uploadButton.remove();
}
