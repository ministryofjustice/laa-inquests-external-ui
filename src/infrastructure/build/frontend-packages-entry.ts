import { initAll as initGOVUK } from "govuk-frontend";
import { initAll as initMOJ } from "@ministryofjustice/frontend";
import {
  MultiFileUpload,
  type MultiFileUploadConfig,
  type MultiFileUploadInstance,
} from "@ministryofjustice/frontend/moj/components/multi-file-upload/multi-file-upload.mjs";
import {
  CLAIM_EVIDENCE_ERROR,
  CLAIM_EVIDENCE_MAX_FILE_SIZE_BYTES,
  CLAIM_FINAL_BILL_TEMPLATE_ERROR,
  CLAIM_FINAL_BILL_TEMPLATE_MAX_FILE_SIZE_BYTES,
  CORONERS_LETTER_ERROR,
  CORONERS_LETTER_MAX_FILE_SIZE_BYTES,
  INVALID_FILE_NAME,
  INVALID_FILE_NAME_REGEX,
} from "#src/infrastructure/locales/constants.js";

const COPY_RESET_DELAY_MS = 4000;

interface FileSizeLimit {
  maxFileSizeBytes: number;
  fileTooLargeMessage: string;
}

// Mirrors the row/error markup the widget renders for a server-rejected file, since the
// ingress blocks oversized or invalid files before they would reach server-side validation.
function renderClientSideUploadError(
  upload: MultiFileUploadInstance,
  file: File,
  message: string,
): void {
  const $row = upload.getFileRow(file);
  const $message = $row.querySelector(".moj-multi-file-upload__message");
  if ($message !== null) {
    $message.innerHTML = upload.getErrorHtml(new Error(message));
  }

  upload.$feedbackContainer.classList.remove("moj-hidden");
  upload.$feedbackContainer
    .querySelector(".moj-multi-file-upload__list")
    ?.append($row);
  upload.$status.textContent = message;
}

// Rejects oversized files in the browser so they never leave the page: otherwise the request
// is sent and blocked at the ingress (ModSecurity 403) before the server can return the error.
class SizeValidatedMultiFileUpload extends MultiFileUpload {
  readonly #sizeLimit: FileSizeLimit;

  constructor(
    root: Element,
    config: MultiFileUploadConfig,
    sizeLimit: FileSizeLimit,
  ) {
    super(root, config);
    this.#sizeLimit = sizeLimit;
  }

  override uploadFile(file: File): void {
    if (file.size > this.#sizeLimit.maxFileSizeBytes) {
      renderClientSideUploadError(
        this,
        file,
        this.#sizeLimit.fileTooLargeMessage,
      );
    } else {
      super.uploadFile(file);
    }
  }
}

function resolveUploadConfig(): {
  uploadRouteBase: string;
  sizeLimit: FileSizeLimit;
} {
  const isFinalBillTemplatePage = window.location.pathname.startsWith(
    "/claim/final-bill-template",
  );
  const isCoronersLetterPage = window.location.pathname.startsWith(
    "/apply/upload-coroners-letter",
  );

  if (isFinalBillTemplatePage) {
    return {
      uploadRouteBase: "/claim/final-bill-template",
      sizeLimit: {
        maxFileSizeBytes: CLAIM_FINAL_BILL_TEMPLATE_MAX_FILE_SIZE_BYTES,
        fileTooLargeMessage: CLAIM_FINAL_BILL_TEMPLATE_ERROR.FILE_TOO_LARGE,
      },
    };
  } else if (isCoronersLetterPage) {
    return {
      uploadRouteBase: "/apply/upload-coroners-letter",
      sizeLimit: {
        maxFileSizeBytes: CORONERS_LETTER_MAX_FILE_SIZE_BYTES,
        fileTooLargeMessage: CORONERS_LETTER_ERROR.FILE_TOO_LARGE,
      },
    };
  } else {
    return {
      uploadRouteBase: "/claim/evidence",
      sizeLimit: {
        maxFileSizeBytes: CLAIM_EVIDENCE_MAX_FILE_SIZE_BYTES,
        fileTooLargeMessage: CLAIM_EVIDENCE_ERROR.FILE_TOO_LARGE,
      },
    };
  }
}

function initialiseMultiFileUpload(): void {
  const multiFileUploadElement = document.querySelector(
    '[data-module="moj-multi-file-upload"]',
  );

  if (multiFileUploadElement !== null) {
    // The widget uploads via XHR and cannot add fields to the request body,
    // so the CSRF token is passed in the query string instead.
    const csrfToken = document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content");
    const csrfQuery =
      csrfToken !== null && csrfToken !== undefined && csrfToken !== ""
        ? `?_csrf=${encodeURIComponent(csrfToken)}`
        : "";

    const { uploadRouteBase, sizeLimit } = resolveUploadConfig();

    void new SizeValidatedMultiFileUpload(
      multiFileUploadElement,
      {
        uploadUrl: `${uploadRouteBase}/upload${csrfQuery}`,
        deleteUrl: `${uploadRouteBase}/delete${csrfQuery}`,
        hooks: {
          entryHook: (upload: MultiFileUploadInstance, file: File): void => {
            /* eslint-disable-next-line require-unicode-regexp -- not expected to have unicode in filenames */
            const filepathRegex = new RegExp(INVALID_FILE_NAME_REGEX);
            if (!filepathRegex.test(file.name)) {
              renderClientSideUploadError(upload, file, INVALID_FILE_NAME);
              throw new Error(INVALID_FILE_NAME);
            }
          },
        },
      },
      sizeLimit,
    );
  }
}

function copyText(
  textElementId: string,
  copyElementId: string,
  screenReaderAlertText: string,
  originalCopyText = "Copy",
): void {
  const textElement = document.querySelector(textElementId);
  const copyElement = document.querySelector<HTMLButtonElement>(copyElementId);
  const screenReaderAlert = document.getElementById("copy-alert");

  if (
    textElement !== null &&
    copyElement !== null &&
    screenReaderAlert !== null
  ) {
    copyElement.addEventListener("click", (e) => {
      e.preventDefault();

      const text = textElement.textContent.trim();
      void window.navigator.clipboard.writeText(text);
      screenReaderAlert.textContent = screenReaderAlertText;
      copyElement.classList.add("disable-click");
      copyElement.textContent = "Copied";

      setTimeout(() => {
        screenReaderAlert.textContent = "";
        copyElement.classList.remove("disable-click");
        copyElement.textContent = originalCopyText;
      }, COPY_RESET_DELAY_MS);

      copyElement.blur();
    });
  }
}

const initialiseFrontendPackages = (): void => {
  if (typeof window !== "undefined") {
    try {
      initGOVUK();
      initMOJ();
      initialiseMultiFileUpload();
      copyText(
        "#claim-reference-number",
        "#copy-claim-reference-number",
        "Reference copied",
        "Copy reference number",
      );

      if (process.env.NODE_ENV !== "production") {
        console.log("Frontend packages loaded and initialised");
      }
    } catch (error: unknown) {
      console.error("Frontend initialization error:", error);
    }
  }
};

initialiseFrontendPackages();
