import { strict as assert } from "assert";
import express from "express";
import request from "supertest";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { createEvidenceRouter } from "#src/infrastructure/express/routes/claim/evidence.router.js";
import { EvidenceAdaptor } from "#src/adaptors/presenters/claim/Evidence/Evidence.adaptor.js";
import type { DownloadEvidenceAdaptor } from "#src/adaptors/presenters/claim/DownloadEvidence/DownloadEvidence.adaptor.js";
import type { UploadEvidenceValidator } from "#src/adaptors/presenters/claim/Evidence/Evidence.validator.js";
import type { UploadEvidenceUseCase } from "#src/use-cases/claim/UploadEvidence.useCase.js";
import type { DeleteEvidenceUseCase } from "#src/use-cases/claim/DeleteEvidence.useCase.js";
import { createAppWithSession } from "./routerTestUtils.js";

describe("createEvidenceRouter", () => {
  it("returns 200 and updates session evidenceFiles on /evidence/delete", async () => {
    const uploadEvidenceValidator = stubInterface<UploadEvidenceValidator>();
    const uploadEvidenceUseCase = stubInterface<UploadEvidenceUseCase>();
    const deleteEvidenceUseCase = stubInterface<DeleteEvidenceUseCase>();
    const downloadEvidenceAdaptor = stubInterface<DownloadEvidenceAdaptor>();

    deleteEvidenceUseCase.execute.resolves({ status: "SUCCESS" });

    const evidenceAdaptor = new EvidenceAdaptor(
      uploadEvidenceValidator,
      uploadEvidenceUseCase,
      deleteEvidenceUseCase,
    );

    const sharedSession: {
      accessToken?: string;
      claim?: {
        evidenceFiles?: Array<{ id: string; fileName: string }>;
      };
    } = {
      accessToken: "token-123",
      claim: {
        evidenceFiles: [
          { id: "file-id-1", fileName: "delete-me.pdf" },
          { id: "file-id-2", fileName: "keep-me.pdf" },
        ],
      },
    };

    const router = express.Router();
    const app = createAppWithSession(
      createEvidenceRouter(router, evidenceAdaptor, downloadEvidenceAdaptor),
      sharedSession,
    );

    const response = await request(app)
      .post("/evidence/delete")
      .set("Content-Type", "application/json")
      .send({ delete: "file-id-1" });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { success: true });
    assert.deepEqual(sharedSession.claim?.evidenceFiles, [
      { id: "file-id-2", fileName: "keep-me.pdf" },
    ]);
    assert.equal(deleteEvidenceUseCase.execute.callCount, 1);
  });
});
