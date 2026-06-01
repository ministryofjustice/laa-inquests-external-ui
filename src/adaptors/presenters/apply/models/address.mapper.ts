import { Address } from "#src/domain/client/Address.js";
import type { ClientHomeAddress } from "#src/infrastructure/express/session/index.types.js";

export function toClientHomeAddressOrNull(
  value: unknown,
): ClientHomeAddress | null {
  const address = Address.fromPersisted(value);
  return address?.toPersisted() ?? null;
}

