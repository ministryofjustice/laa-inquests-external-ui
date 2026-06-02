import type { Proceeding } from "#src/domain/proceedings/Proceeding.js";

export class ProceedingsSelection {
  static filterAvailable(
    selectedProceedings: Proceeding[],
    allProceedings: Proceeding[],
  ): Proceeding[] {
    return allProceedings.filter(
      (option) =>
        !selectedProceedings.some(
          (selectedOption) =>
            selectedOption.proceedingId === option.proceedingId,
        ),
    );
  }

  static hasAtLeastOne(selectedProceedings: unknown[]): boolean {
    return selectedProceedings.length > 0;
  }

  static removeById(
    selectedProceedings: Proceeding[] | undefined,
    proceedingId: string,
  ): Proceeding[] | undefined {
    return selectedProceedings?.filter(
      (proceeding) => proceeding.proceedingId !== proceedingId,
    );
  }
}

