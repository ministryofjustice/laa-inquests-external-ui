import { initAll as initGOVUK } from "govuk-frontend";
import { initAll as initMOJ } from "@ministryofjustice/frontend";
import { MultiFileUpload } from "@ministryofjustice/frontend/moj/components/multi-file-upload/multi-file-upload.mjs";

const COPY_RESET_DELAY_MS = 4000;

// Captured to restore later via `.call(this, ...)`, preserving the caller's `this`.
// eslint-disable-next-line @typescript-eslint/unbound-method, @typescript-eslint/prefer-destructuring -- overloaded XHR method reference, already destructured
const { open } = XMLHttpRequest.prototype;
const originalXhrOpen = open;

type XhrOpenArgs = [
  async?: boolean,
  username?: string | null,
  password?: string | null,
];

// TEST CANDIDATE (transport isolation): sends the CSRF token as a header
// instead of a query string param, for every XHR opened against
// `uploadRouteBase`, to check whether the query string trips the WAF.
function patchXhrOpenToSendCsrfHeader(
  uploadRouteBase: string,
  csrfToken: string,
): void {
  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    ...openArgs: XhrOpenArgs
  ): void {
    const [async = true, username, password] = openArgs;
    originalXhrOpen.call(this, method, url, async, username, password);
    if (typeof url === "string" && url.startsWith(uploadRouteBase)) {
      this.setRequestHeader("X-CSRF-Token", csrfToken);
    }
  };
}

function initialiseMultiFileUpload(): void {
  const multiFileUploadElement = document.querySelector(
    '[data-module="moj-multi-file-upload"]',
  );

  if (multiFileUploadElement !== null) {
    const csrfToken = document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content");

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

    if (csrfToken !== null && csrfToken !== undefined && csrfToken !== "") {
      patchXhrOpenToSendCsrfHeader(uploadRouteBase, csrfToken);
    }

    void new MultiFileUpload(multiFileUploadElement, {
      uploadUrl: `${uploadRouteBase}/upload`,
      deleteUrl: `${uploadRouteBase}/delete`,
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
