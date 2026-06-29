import type { Router, Request, Response } from "express";
import type { Session } from "express-session";
import {
  resetMockSubmitStatus,
  setMockSubmitStatus,
} from "#src/adaptors/source/inquests-api/apply/SubmitApplication/SubmitApplication.adaptor.js";

export default function createTestRouter(router: Router): Router {
  const SUCCESSFUL_REQUEST = 200;

  const seedAuthSession = (
    req: Request & {
      session: Session & {
        userId?: string;
        user?: { name?: string };
        firmCode?: string;
        officeId?: string;
        providerEmail?: string;
      };
    },
  ): void => {
    req.session.userId = "test-user-id";
    req.session.user = { name: "Test User" };
    req.session.firmCode = "0A123B";
    req.session.officeId = "001";
    req.session.providerEmail = "test@example.com";
  };

  const seedConfirmationSession = (
    req: Request & {
      session: Session & {
        userId?: string;
        user?: { name?: string };
        firmCode?: string;
        officeId?: string;
        providerEmail?: string;
      };
    },
  ): void => {
    seedAuthSession(req);

    req.session.clientFirstName = "Test";
    req.session.clientLastName = "User";
    req.session.clientDobDay = "01";
    req.session.clientDobMonth = "01";
    req.session.clientDobYear = "1990";
    req.session.clientHasNoFixedAbode = true;
    req.session.clientCorrespondenceAddressSource = "USE_PROVIDER_ADDRESS";

    req.session.deceasedFirstName = "Deceased";
    req.session.deceasedLastName = "Person";
    req.session.deceasedDateOfBirthDay = "01";
    req.session.deceasedDateOfBirthMonth = "01";
    req.session.deceasedDateOfBirthYear = "1960";
    req.session.deceasedDateOfDeathDay = "01";
    req.session.deceasedDateOfDeathMonth = "01";
    req.session.deceasedDateOfDeathYear = "2024";
    req.session.deceasedClientRelationship = "Sibling";
    req.session.deceasedCoronerReference = "COR-123";
    req.session.deceasedFurtherInformation = "No additional details";

    req.session.selectedProceedings = [
      {
        proceedingId: "MN035",
        proceedingDescription: "Clinical Negligence",
        matterType: "INQUEST",
      },
    ];

    req.session.selectedPublicAuthorities = [
      {
        publicAuthorityId: "cabinet-office",
        publicAuthorityDescription: "Cabinet Office",
      },
    ];
  };

  router.get(
    "/test/auth-session",
    (
      req: Request & {
        session: Session & {
          userId?: string;
          user?: { name?: string };
          firmCode?: string;
          officeId?: string;
          providerEmail?: string;
        };
      },
      res: Response,
    ): void => {
      seedAuthSession(req);
      req.session.save(() => {
        res.status(SUCCESSFUL_REQUEST).send("Session was seeded successfully.");
      });
    },
  );

  router.get(
    "/test/seed-confirmation-session",
    (
      req: Request & {
        session: Session & {
          userId?: string;
          user?: { name?: string };
          firmCode?: string;
          officeId?: string;
          providerEmail?: string;
        };
      },
      res: Response,
    ): void => {
      seedConfirmationSession(req);
      req.session.save(() => {
        res.status(SUCCESSFUL_REQUEST).send("Confirmation session seeded.");
      });
    },
  );

  router.get(
    "/test/mock-submit-status/:status",
    (req: Request, res: Response): void => {
      const parsedStatus = Number(req.params.status);
      if (Number.isFinite(parsedStatus)) {
        setMockSubmitStatus(parsedStatus);
      }

      res.status(SUCCESSFUL_REQUEST).send("Mock submit status updated.");
    },
  );

  router.get(
    "/test/reset-mock-submit-status",
    (_req: Request, res: Response): void => {
      resetMockSubmitStatus();
      res.status(SUCCESSFUL_REQUEST).send("Mock submit status reset.");
    },
  );

  return router;
}
