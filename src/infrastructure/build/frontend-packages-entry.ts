import { initAll as initGOVUK } from "govuk-frontend";
import { initAll as initMOJ } from "@ministryofjustice/frontend";
import { MultiFileUpload } from "@ministryofjustice/frontend/moj/components/multi-file-upload/multi-file-upload.mjs";

const COPY_RESET_DELAY_MS = 4000;

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

    void new MultiFileUpload(multiFileUploadElement, {
      uploadUrl: `${uploadRouteBase}/upload${csrfQuery}`,
      deleteUrl: `${uploadRouteBase}/delete${csrfQuery}`,
    });
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
