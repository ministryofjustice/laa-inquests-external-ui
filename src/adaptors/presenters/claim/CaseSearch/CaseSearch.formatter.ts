import type { SearchCase } from "#src/adaptors/source/inquests-api/claim/SearchCases/models/SearchCases.types.js";
import type { ClaimClientDetails } from "#src/infrastructure/express/session/index.types.js";
import { formatISODateDDMMYYYY } from "#src/utils/dateFormatter.js";

export interface FormattedCase {
  reference: string;
  clientName: string;
  clientFirstName: string;
  clientLastName: string;
  dateOfBirth: string;
  dateSubmitted: string;
  firmNameAndNumber: string;
  overallDecision: string;
}

export class CaseSearchFormatter {
  formatCases(cases: SearchCase[]): FormattedCase[] {
    return cases.map((c) => ({
      reference: String(c.laaReference),
      clientName: [c.clientFirstName, c.clientLastName]
        .filter(Boolean)
        .join(" "),
      clientFirstName: c.clientFirstName,
      clientLastName: c.clientLastName,
      dateOfBirth: formatISODateDDMMYYYY(c.clientDateOfBirth),
      dateSubmitted: formatISODateDDMMYYYY(c.dateSubmitted),
      firmNameAndNumber: [c.firmName, c.firmNumber].filter(Boolean).join(" "),
      overallDecision: c.overallDecision,
    }));
  }

  formatClientDetails(cases: SearchCase[]): ClaimClientDetails[] {
    return this.formatCases(cases).map((c) => ({
      reference: c.reference,
      clientName: c.clientName,
      clientFirstName: c.clientFirstName,
      clientLastName: c.clientLastName,
      dateOfBirth: c.dateOfBirth,
    }));
  }
}
