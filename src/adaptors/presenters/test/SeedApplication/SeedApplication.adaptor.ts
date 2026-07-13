import type { Request, Response } from "express";
import {
  CORRESPONDENCE_ADDRESS_SOURCE,
  HTTP_CREATED,
} from "#src/infrastructure/locales/constants.js";
import type { SubmitApplicationAdaptor } from "#src/adaptors/source/inquests-api/apply/SubmitApplication/SubmitApplication.adaptor.js";
import type { SubmitApplicationRequest } from "#src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.types.js";
import type { UploadCoronersLetterAdaptor } from "#src/adaptors/source/inquests-api/apply/UploadCoronersLetter/UploadCoronersLetterAdaptor.js";

const HTTP_INTERNAL_SERVER_ERROR = 500;

export class SeedApplicationAdaptor {
  constructor(
    private readonly submitApplicationAdaptor: SubmitApplicationAdaptor,
    private readonly uploadCoronersLetterAdaptor: UploadCoronersLetterAdaptor,
  ) {}

  async seedApplication(req: Request, res: Response): Promise<void> {
    const { session } = req;
    const { accessToken, firmCode, officeId, providerEmail } = session;
    if (
      accessToken === undefined ||
      firmCode === undefined ||
      officeId === undefined ||
      providerEmail === undefined
    ) {
      res.status(HTTP_INTERNAL_SERVER_ERROR).json({
        message: "Missing authentication session fields for seeding",
      });
      return;
    }

    const uploadResponse =
      await this.uploadCoronersLetterAdaptor.uploadCoronersLetter(
        {
          buffer: Buffer.from("seeded coroners letter content"),
          mimetype: "application/pdf",
          originalname: "seeded-coroners-letter.pdf",
        },
        accessToken,
      );

    if (
      uploadResponse.status !== "SUCCESS" ||
      uploadResponse.coronersLetterId === undefined
    ) {
      res.status(HTTP_INTERNAL_SERVER_ERROR).json({
        message: "Failed to upload coroner's letter for seeding",
      });
      return;
    }

    const requestBody = this.#buildSeedRequestBody(
      req,
      uploadResponse.coronersLetterId,
    );
    const response = await this.submitApplicationAdaptor.submitApplication(
      requestBody,
      accessToken,
    );

    if (response.statusCode !== HTTP_CREATED) {
      res.status(HTTP_INTERNAL_SERVER_ERROR).json({
        message: "Failed to seed application",
      });
      return;
    }

    session.applicationReferenceNumber = String(response.laaReference);

    res.status(HTTP_CREATED).json({
      laaReference: response.laaReference,
    });
  }

  #buildSeedRequestBody(
    req: Request,
    coronersLetterId: string,
  ): SubmitApplicationRequest {
    const { session } = req;

    return {
      client: {
        clientFirstName: "Seed",
        clientLastName: "Provider",
        clientLastNameAtBirth: "Provider",
        dateOfBirth: "01-01-1990",
        nationalInsuranceNumber: "PC123456C",
        hasNoFixedAbode: false,
        homeAddress: {
          addressLine1: "1 Seed Street",
          addressLine2: null,
          townOrCity: "Seedtown",
          county: null,
          postcode: "SW1A1AA",
        },
        correspondenceAddressSource:
          CORRESPONDENCE_ADDRESS_SOURCE.USE_PROVIDER_ADDRESS,
        correspondenceAddress: null,
        isClientCorrespondenceRecipient: true,
      },
      deceased: {
        deceasedFirstName: "Deceased",
        deceasedLastName: "Person",
        deceasedDateOfBirth: "01-01-2000",
        deceasedDateOfDeath: "01-01-2025",
        coronersReference: "seed-reference-123",
        furtherInformation: "seeded for claims journey",
        clientRelationshipToDeceased: "guardian",
      },
      proceedings: [
        {
          proceedingId: "PC049",
        },
      ],
      publicBodies: [
        {
          publicBodyId: "Department for Transport",
        },
      ],
      provider: {
        firmCode: session.firmCode!,
        officeId: session.officeId!,
        emailAddress: session.providerEmail!,
      },
      coronersLetterId,
    };
  }
}
