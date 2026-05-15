import type { Request, Response } from "express";
import {
  SubmitApplicationRequestSchema,
  SubmitApplicationResponseSchema,
} from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import type {
  ApplySubmitPort,
  SubmitApplicationRequest,
} from "#src/ports/source/inquests-api/SubmitApplication.port.js";

import type { Proceeding } from "#src/infrastructure/express/session/index.types.js";
import { formatDateISO8601 } from "#src/utils/dateFormatter.js";
import { HTTP_CREATED } from "#src/infrastructure/locales/constants.js";

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

  async processClientDeclarationForm(
    req: Request,
    res: Response,
  ): Promise<void> {
    const submitBody = this.#generateSubmitBody(req);
    const { session } = req;
    const responseRaw =
      await this.applySubmitPort.submitApplication(submitBody);
    const { statusCode, applicationReferenceNumber } =
      SubmitApplicationResponseSchema.parse(responseRaw);

    if (statusCode === HTTP_CREATED) {
      session.applicationReferenceNumber = applicationReferenceNumber;
      res.redirect("/apply/confirmation/success");
    }
  }

  #generateSubmitBody(req: Request): SubmitApplicationRequest {
    const selectedProceedings = req.session.selectedProceedings ?? [];
    const publicBodies =
      req.session.selectedPublicAuthorities?.map((body) => ({
        publicBodyDescription: body.publicAuthorityDescription,
      })) ?? [];

    // Build the payload
    const submitBodyRaw = {
      client: {
        clientFirstName: req.session.clientFirstName as string,
        clientLastName: req.session.clientLastName as string,
        clientLastNameAtBirth: req.session.clientLastNameAtBirth as
          | string
          | undefined,
        clientDob: formatDateISO8601(
          req.session.clientDobYear,
          req.session.clientDobMonth,
          req.session.clientDobDay,
        ),
        clientNino: req.session.clientNino as string | undefined,
        relationshipToDeceased: (req.session.deceasedClientRelationship ??
          "") as string,
      },
      deceased: {
        deceasedFirstName: req.session.deceasedFirstName as string,
        deceasedLastName: req.session.deceasedLastName as string,
        deceasedDob: formatDateISO8601(
          req.session.deceasedDateOfBirthYear,
          req.session.deceasedDateOfBirthMonth,
          req.session.deceasedDateOfBirthDay,
        ),
        deceasedDateOfDeath: formatDateISO8601(
          req.session.deceasedDateOfDeathYear,
          req.session.deceasedDateOfDeathMonth,
          req.session.deceasedDateOfDeathDay,
        ),
        coronersReference: (req.session.deceasedCoronerReference ??
          "") as string,
        furtherInformation: (req.session.deceasedFurtherInformation ??
          "") as string,
      },
      proceedings: selectedProceedings.map((proceeding: Proceeding) => ({
        proceedingId: proceeding.proceedingId,
        proceedingDescription: proceeding.proceedingDescription,
      })),
      publicBodies,
    };

    // Validate and parse with Zod
    const submitBody = SubmitApplicationRequestSchema.parse(submitBodyRaw);
    return submitBody;
  }
}
