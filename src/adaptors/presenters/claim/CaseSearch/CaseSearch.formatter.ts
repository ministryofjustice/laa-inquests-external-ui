import type { SearchCase } from "#src/adaptors/source/inquests-api/claim/SearchCases/models/SearchCases.types.js";
import { formatISODateDDMMYYYY } from "#src/utils/dateFormatter.js";

export interface FormattedCase {
  reference: string;
  clientName: string;
  dateOfBirth: string;
  dateSubmitted: string;
  firmNameAndNumber: string;
  overallDecision: string;
}

export class CaseSearchFormatter {
  formatCases(cases: SearchCase[]): FormattedCase[] {
    return cases.map((c) => ({
      reference: String(c.laaReference),
      clientName: c.clientName,
      dateOfBirth: formatISODateDDMMYYYY(c.clientDateOfBirth),
      dateSubmitted: formatISODateDDMMYYYY(c.dateSubmitted),
      firmNameAndNumber: [c.firmName, c.firmNumber].filter(Boolean).join(" "),
      overallDecision: c.overallDecision,
    }));
  }
}
