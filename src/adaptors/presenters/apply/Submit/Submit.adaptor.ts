import type { Request, Response } from "express";
import {
} from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import type {
  ApplySubmitPort,
} from "#src/ports/source/inquests-api/SubmitApplication.port.js";

import type { Proceeding } from "#src/infrastructure/express/session/index.types.js";
import { formatDateDDMMYYYY } from "#src/utils/dateFormatter.js";
import { HTTP_CREATED } from "#src/infrastructure/locales/constants.js";
import { SubmitApplicationRequestSchema, SubmitApplicationResponseSchema } from "#src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.schema.js";
import { SubmitApplicationRequest } from "#src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.types.js";

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
    const { statusCode, laaReference } =
      SubmitApplicationResponseSchema.parse(responseRaw);

    if (statusCode === HTTP_CREATED) {
      session.applicationReferenceNumber = laaReference.toString();
      res.redirect("/apply/confirmation/success");
    }
  }

  #generateSubmitBody(req: Request): SubmitApplicationRequest {
    const { session } = req;
    const selectedProceedings = req.session.selectedProceedings ?? [];
    const publicBodies =
      req.session.selectedPublicAuthorities?.map((body) => ({
        publicBodyId: body.publicAuthorityDescription,
      })) ?? [];
    const { clientLastNameAtBirth, clientNino } = session;

    const client: SubmitApplicationRequest["client"] = {
      clientFirstName: req.session.clientFirstName as string,
      clientLastName: req.session.clientLastName as string,
      dateOfBirth: formatDateDDMMYYYY(
        req.session.clientDobYear,
        req.session.clientDobMonth,
        req.session.clientDobDay,
      ),
    };

    if (typeof clientLastNameAtBirth === "string") {
      client.clientLastNameAtBirth = clientLastNameAtBirth;
    }

    if (typeof clientNino === "string") {
      client.nationalInsuranceNumber = clientNino;
    }

    // Build the payload
    const submitBodyRaw = {
      client,
      deceased: {
        deceasedFirstName: req.session.deceasedFirstName as string,
        deceasedLastName: req.session.deceasedLastName as string,
        deceasedDateOfBirth: formatDateDDMMYYYY(
          req.session.deceasedDateOfBirthYear,
          req.session.deceasedDateOfBirthMonth,
          req.session.deceasedDateOfBirthDay,
        ),
        deceasedDateOfDeath: formatDateDDMMYYYY(
          req.session.deceasedDateOfDeathYear,
          req.session.deceasedDateOfDeathMonth,
          req.session.deceasedDateOfDeathDay,
        ),
        coronersReference: (req.session.deceasedCoronerReference ??
          "") as string,
        furtherInformation: (req.session.deceasedFurtherInformation ??
          "") as string,
        clientRelationshipToDeceased: (req.session.deceasedClientRelationship ??
          "") as string,
      },
      proceedings: selectedProceedings.map((proceeding: Proceeding) => ({
        proceedingId: proceeding.proceedingId,
      })),
      publicBodies,
    };

    // Validate and parse with Zod
    const submitBody = SubmitApplicationRequestSchema.parse(submitBodyRaw);
    return submitBody;
  }
}
