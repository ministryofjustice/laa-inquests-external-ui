export const getStringValue = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

export const getNullableStringValue = (
  value: unknown,
): string | null | undefined =>
  typeof value === "string" || value === null ? value : undefined;
