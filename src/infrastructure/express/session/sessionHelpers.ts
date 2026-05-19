import type { Request } from "express";

export class SessionHelper {
  storeSessionData(
    req: Request,
    namespace: string,
    data: Record<string, string>,
  ): void {
    // Store our typed data directly in the session
    req.session[namespace] = data;
  }

  getSessionData(
    req: Request,
    namespace: string,
  ): Record<string, string> | null {
    const { session } = req;
    const { [namespace]: data } = session;
    // Return the data if it's a Record, otherwise null for undefined or string
    return typeof data === "object" ? data : null;
  }

  clearSessionData(req: Request, namespace: string): void {
    req.session[namespace] = undefined;
  }

  clearApplyFormData(req: Request): void {
    const sessionKeys = Object.keys(req.session);
    sessionKeys
      .filter((k) => k !== "cookie")
      .forEach((key) => {
        req.session[key] = undefined;
      });
  }

  /**
   * Clear all session data for form original values
   * Removes any session keys that contain 'Original' in the name
   */
  clearAllOriginalFormData(req: Request): void {
    // Get all session keys and filter for ones containing 'Original'
    const sessionKeys = Object.keys(req.session);
    const originalDataKeys = sessionKeys.filter((key) =>
      key.includes("Original"),
    );

    // Clear each original form data key
    originalDataKeys.forEach((key) => {
      req.session[key] = undefined;
    });
  }

  storeOriginalFormData(
    req: Request,
    namespace: string,
    formData: Record<string, unknown>,
  ): void {
    // Convert all form values to strings for consistent comparison
    const stringifiedData: Record<string, string> = {};

    for (const [key, value] of Object.entries(formData)) {
      // Convert all values to strings, handling null/undefined as empty string
      stringifiedData[key] = value?.toString() ?? "";
    }

    this.storeSessionData(req, namespace, stringifiedData);
  }
}
