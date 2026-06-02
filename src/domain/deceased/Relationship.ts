export class Relationship {
  static isSelectionMissing(value: unknown): boolean {
    return typeof value !== "string";
  }

  static isEligible(value: string): boolean {
    return value !== "false";
  }
}

