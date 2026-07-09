import { initAll as initGOVUK } from "govuk-frontend";
import { initAll as initMOJ } from "@ministryofjustice/frontend";

const COPY_RESET_DELAY_MS = 4000;

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
