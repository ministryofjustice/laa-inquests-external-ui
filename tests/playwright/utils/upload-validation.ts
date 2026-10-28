import { test, expect } from "../fixtures/index.js";

export function testFilenameUploadErrors(
  validFileName: string,
  validMimeType: string,
  allowedTypeMessage: string,
): void {
  const cases = [
    {
      condition: "invalid file type",
      name: "file1.exe",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("invalid file content"),
      message: `file1.exe must be ${allowedTypeMessage}`,
    },
    {
      condition: "empty file",
      name: validFileName,
      mimeType: validMimeType,
      buffer: Buffer.alloc(0),
      message: `${validFileName} is empty`,
    },
    {
      condition: "virus",
      name: `virus.${validFileName.split(".").at(-1)}`,
      mimeType: validMimeType,
      buffer: Buffer.from("mock virus content"),
      message: `virus.${validFileName.split(".").at(-1)} contains a virus`,
    },
  ];

  for (const upload of cases) {
    test(`identifies the filename for an ${upload.condition} error`, async ({
      page,
      checkAccessibility,
    }) => {
      await page.setInputFiles("#documents", {
        name: upload.name,
        mimeType: upload.mimeType,
        buffer: upload.buffer,
      });

      await expect(
        page.locator(".moj-multi-file-upload__error"),
      ).toHaveText(upload.message);
      await checkAccessibility();
    });
  }
}
