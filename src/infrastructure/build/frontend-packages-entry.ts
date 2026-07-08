import { initAll as initGOVUK } from "govuk-frontend";
import { initAll as initMOJ } from "@ministryofjustice/frontend";

const getCopyTextForButton = (copyButton: HTMLButtonElement): string | null => {
  const sourceSelector = copyButton.getAttribute("data-copy-source-selector");

  if (sourceSelector === null || sourceSelector.trim() === "") {
    return null;
  }

  const sourceElement = document.querySelector<HTMLElement>(sourceSelector);

  if (sourceElement === null) {
    return null;
  }

  const { textContent: textToCopy } = sourceElement;

  if (textToCopy.trim() === "") {
    return null;
  }

  return textToCopy.trim();
};

const initialiseClipboardCopyButtons = (): void => {
  if (typeof navigator === "undefined" || !("clipboard" in navigator)) {
    return;
  }

  const copyButtons = document.querySelectorAll<HTMLButtonElement>(
    "[data-copy-button]",
  );

  copyButtons.forEach((copyButton) => {
    copyButton.addEventListener("click", () => {
      const textToCopy = getCopyTextForButton(copyButton);

      if (textToCopy === null) {
        return;
      }

      void navigator.clipboard.writeText(textToCopy);
    });
  });
};

const initialiseFrontendPackages = (): void => {
  if (typeof window !== "undefined") {
    try {
      initGOVUK();
      initMOJ();
      initialiseClipboardCopyButtons();

      if (process.env.NODE_ENV !== "production") {
        console.log("Frontend packages loaded and initialised");
      }
    } catch (error: unknown) {
      console.error("Frontend initialization error:", error);
    }
  }
};

initialiseFrontendPackages();
