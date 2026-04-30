declare module "express-session" {
  interface SessionData extends Record<
    string,
    Record<string, string> | string | boolean | undefined
  > {
    // This allows both specific properties and dynamic namespace access
  }
}
