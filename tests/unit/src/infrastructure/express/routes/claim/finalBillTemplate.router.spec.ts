import { strict as assert } from "assert";
import express from "express";
import request from "supertest";
import { stubInterface } from "ts-sinon";
import { createFinalBillTemplateRouter } from "#src/infrastructure/express/routes/claim/finalBillTemplate.router.js";
import { FinalBillTemplateAdaptor } from "#src/adaptors/presenters/claim/FinalBillTemplate/FinalBillTemplate.adaptor.js";
import type { FinalBillTemplateValidator } from "#src/adaptors/presenters/claim/FinalBillTemplate/FinalBillTemplate.validator.js";
import type { UploadEvidenceUseCase } from "#src/use-cases/claim/UploadEvidence.useCase.js";
import type { DeleteEvidenceUseCase } from "#src/use-cases/claim/DeleteEvidence.useCase.js";
import { createAppWithSession } from "./routerTestUtils.js";

describe("createFinalBillTemplateRouter", () => {
  it("returns 200 and clears session finalBillCostTemplate on /final-bill-template/delete", async () => {
    const formValidator = stubInterface<FinalBillTemplateValidator>();
    const uploadEvidenceUseCase = stubInterface<UploadEvidenceUseCase>();
    const deleteEvidenceUseCase = stubInterface<DeleteEvidenceUseCase>();

    deleteEvidenceUseCase.execute.resolves({ status: "SUCCESS" });

    const finalBillTemplateAdaptor = new FinalBillTemplateAdaptor(
      formValidator,
      uploadEvidenceUseCase,
      deleteEvidenceUseCase,
    );

    const sharedSession: {
      accessToken?: string;
      claim?: {
        finalBillCostTemplate?: {
          costTemplateId: string;
          costTemplateFilename: string;
        };
      };
    } = {
      accessToken: "token-123",
      claim: {
        finalBillCostTemplate: {
          costTemplateId: "template-id-1",
          costTemplateFilename: "cost-template.xlsx",
        },
      },
    };

    const router = express.Router();
    const app = createAppWithSession(
      createFinalBillTemplateRouter(router, finalBillTemplateAdaptor),
      sharedSession,
    );

    const response = await request(app)
      .post("/final-bill-template/delete")
      .set("Content-Type", "application/json")
      .send({ delete: "template-id-1" });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { success: true });
    assert.equal(sharedSession.claim?.finalBillCostTemplate, undefined);
    assert.equal(deleteEvidenceUseCase.execute.callCount, 1);
  });
});
