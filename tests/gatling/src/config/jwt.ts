const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Pure-JS base64 decode (no Buffer/atob) — Gatling's JS runtime isn't plain
// Node, so Node/browser built-ins can't be relied on inside bundled code.
function base64Decode(input: string): string {
  let output = "";
  let buffer = 0;
  let bits = 0;
  for (const char of input) {
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) {
      continue;
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length < 2) {
    throw new Error(
      "Access token does not look like a JWT (expected header.payload.signature).",
    );
  }
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(base64Decode(base64)) as Record<string, unknown>;
}
