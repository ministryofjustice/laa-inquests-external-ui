import type { Request, Response } from "express";
import type {
  ApplySubmitPort,
} from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import {
  SubmitApplicationRequestSchema,
  SubmitApplicationResponseSchema,
} from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import type { Proceeding } from "#src/infrastructure/express/session/index.types.js";

export class SubmitAdaptor {
  applySubmitPort: ApplySubmitPort;

  constructor(applySubmitPort: ApplySubmitPort) {
    this.applySubmitPort = applySubmitPort;
  }

  renderClientDeclarationForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/submit/client-declaration", {
      csrfToken,
      clientDetails: {
        firstName: req.session.clientFirstName ?? "",
        lastName: req.session.clientLastName ?? "",
      },
    });
  }

  async processClientDeclarationForm(req: Request, res: Response): Promise<void> {
    const selectedProceedings = req.session.selectedProceedings ?? [];
    const publicBodies = Array.isArray(req.session.publicBodies)
      ? req.session.publicBodies
          .map((publicBody) => {
            if (
              typeof publicBody === "object" &&
              publicBody !== null &&
              "publicBodyDescription" in publicBody &&
              typeof publicBody.publicBodyDescription === "string"
            ) {
              return {
                publicBodyDescription: publicBody.publicBodyDescription,
              };
            }

            return null;
          })
          .filter(
            (
              publicBody,
            ): publicBody is { publicBodyDescription: string } =>
              publicBody !== null,
          )
      : [];

    // Build the payload
    const submitBodyRaw = {
      client: {
        clientFirstName: (req.session.clientFirstName ?? "") as string,
        clientLastName: (req.session.clientLastName ?? "") as string,
        clientLastNameAtBirth: req.session.clientLastNameAtBirth as string | undefined,
        clientDob: this.#formatDate(
          req.session.clientDobYear,
          req.session.clientDobMonth,
          req.session.clientDobDay,
        ),
        clientNino: req.session.clientNino as string | undefined,
        relationshipToDeceased: (req.session.deceasedClientRelationship ?? "") as string,
      },
      deceased: {
        deceasedFirstName: (req.session.deceasedFirstName ?? "") as string,
        deceasedLastName: (req.session.deceasedLastName ?? "") as string,
        deceasedDob: this.#formatDate(
          req.session.deceasedDateOfBirthYear,
          req.session.deceasedDateOfBirthMonth,
          req.session.deceasedDateOfBirthDay,
        ),
        deceasedDateOfDeath: this.#formatDate(
          req.session.deceasedDateOfDeathYear,
          req.session.deceasedDateOfDeathMonth,
          req.session.deceasedDateOfDeathDay,
        ),
        coronersReference: (req.session.deceasedCoronerReference ?? "") as string,
        furtherInformation: (req.session.deceasedFurtherInformation ?? "") as string,
      },
      proceedings: selectedProceedings.map((proceeding: Proceeding) => ({
        proceedingId: proceeding.proceedingId,
        proceedingDescription: proceeding.proceedingDescription,
      })),
      publicBodies,
    };

    // Validate and parse with Zod
    const submitBody = SubmitApplicationRequestSchema.parse(submitBodyRaw);

    const responseRaw = await this.applySubmitPort.submitApplication(submitBody);
    const response = SubmitApplicationResponseSchema.parse(responseRaw);

    if (response.statusCode === 201) {
      req.session.applicationReferenceNumber = response.applicationReferenceNumber;
      res.redirect("/apply/confirmation/success");
    }
  }

  #formatDate(
    year: unknown,
    month: unknown,
    day: unknown,
  ): string {
    const formattedYear = typeof year === "string" ? year : "";
    const formattedMonth = typeof month === "string" ? month : "";
    const formattedDay = typeof day === "string" ? day : "";

    return `${formattedYear}-${formattedMonth}-${formattedDay}`;
  }
}
