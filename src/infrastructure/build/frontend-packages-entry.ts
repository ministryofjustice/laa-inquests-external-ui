import { initAll as initGOVUK } from "govuk-frontend";
import { initAll as initMOJ } from "@ministryofjustice/frontend";
import { MultiFileUpload } from "@ministryofjustice/frontend/moj/components/multi-file-upload/multi-file-upload.mjs";

const COPY_RESET_DELAY_MS = 4000;

// Mirrors the allowed character set enforced server-side (A-Za-z0-9.!()_ -).
const FILENAME_UNSAFE_CHARACTERS = /[^A-Za-z0-9.!\(\)_ \-]/gv;

function sanitiseFileName(name: string): string {
  return name.replace(FILENAME_UNSAFE_CHARACTERS, "");
}

// Renames the file client-side so characters that can trip an upstream WAF
// (e.g. apostrophes) never leave the browser in the multipart request.
function sanitiseFile(file: File): File {
  const safeName = sanitiseFileName(file.name);
  if (safeName === file.name) {
    return file;
  }

  return new File([file], safeName, {
    type: file.type,
    lastModified: file.lastModified,
  });
}

interface MultiFileUploadInstance {
  uploadFile: (file: File) => void;
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

    const isFinalBillTemplatePage = window.location.pathname.startsWith(
      "/claim/final-bill-template",
    );
    const isCoronersLetterPage = window.location.pathname.startsWith(
      "/apply/upload-coroners-letter",
    );
    let uploadRouteBase = "/claim/evidence";
    if (isFinalBillTemplatePage) {
      uploadRouteBase = "/claim/final-bill-template";
    } else if (isCoronersLetterPage) {
      uploadRouteBase = "/apply/upload-coroners-letter";
    }

    const multiFileUpload = new MultiFileUpload(multiFileUploadElement, {
      uploadUrl: `${uploadRouteBase}/upload${csrfQuery}`,
      deleteUrl: `${uploadRouteBase}/delete${csrfQuery}`,
    }) as MultiFileUploadInstance;

    const originalUploadFile = multiFileUpload.uploadFile.bind(multiFileUpload);
    multiFileUpload.uploadFile = (file: File): void => {
      originalUploadFile(sanitiseFile(file));
    };
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
