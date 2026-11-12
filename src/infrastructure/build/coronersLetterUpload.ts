import { HTTP_CREATED } from "#src/infrastructure/locales/constants.js";

const FIRST_FILE_INDEX = 0;

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
  const status = document.getElementById("coroners-letter-upload-status");
  const uploadedFileControls = getUploadedFileControls();
  if (uploadedFileControls === undefined) {
    return;
  }
  const { uploadedFile, fileName, deleteButton } = uploadedFileControls;

  if (
    input === null ||
    token === null ||
    uploadButton === null ||
    continueButton === null ||
    status === null
  ) {
    return;
  }

  const state = { pending: false };
  const group = input.closest(".govuk-form-group");
  const control = form.querySelector<HTMLButtonElement>("#documents");
  const failureMessage = form.dataset.failureMessage!;
  const uploadingMessage = form.dataset.uploadingMessage!;
  const uploadedMessage = form.dataset.uploadedMessage!;

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
    status!.textContent = uploadedMessage;
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
    status!.textContent = message;
  }

  async function uploadFile(): Promise<void> {
    const file = input!.files?.item(FIRST_FILE_INDEX);
    if (state.pending || file === undefined || file === null) {
      return;
    }

    setPending(true);
    status!.textContent = uploadingMessage;
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
