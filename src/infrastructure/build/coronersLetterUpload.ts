import {
  CORONERS_LETTER_ERROR,
  CORONERS_LETTER_MAX_FILE_SIZE_BYTES,
  INVALID_FILE_NAME,
  INVALID_FILE_NAME_REGEX,
} from "#src/infrastructure/locales/constants.js";

const FIRST_FILE_INDEX = 0;

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
  const { deleteButton } = uploadedFileControls;

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

  function uploadFile(): void {
    const file = input!.files?.item(FIRST_FILE_INDEX);
    if (state.pending || file === undefined || file === null) {
      return;
    }

    const validationError = validateFileSize(file) ?? validateFileName(file);
    if (validationError !== undefined) {
      showError(validationError);
      return;
    }

    state.pending = true;
    continueButton!.disabled = true;
    deleteButton.disabled = true;
    // Keep the file input enabled so its contents are included in the POST.
    if (control !== null) {
      control.disabled = true;
    }
    form!.submit();
  }

  input.addEventListener("change", () => {
    uploadFile();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    uploadFile();
  });
  continueForm.addEventListener("submit", (event) => {
    if (state.pending) {
      event.preventDefault();
    }
  });
  uploadButton.remove();
}
