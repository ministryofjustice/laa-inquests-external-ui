import { strict as assert } from "assert";
import express from "express";
import request from "supertest";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { createEvidenceRouter } from "#src/infrastructure/express/routes/claim/evidence.router.js";
import { EvidenceAdaptor } from "#src/adaptors/presenters/claim/Evidence/Evidence.adaptor.js";
import type { UploadEvidenceValidator } from "#src/adaptors/presenters/claim/Evidence/Evidence.validator.js";
import type { UploadEvidenceUseCase } from "#src/use-cases/claim/UploadEvidence.useCase.js";
import type { DeleteEvidenceUseCase } from "#src/use-cases/claim/DeleteEvidence.useCase.js";

describe("createEvidenceRouter", () => {
  it("returns 200 and updates session evidenceFiles on /evidence/delete", async () => {
    const uploadEvidenceValidator = stubInterface<UploadEvidenceValidator>();
    const uploadEvidenceUseCase = stubInterface<UploadEvidenceUseCase>();
    const deleteEvidenceUseCase = stubInterface<DeleteEvidenceUseCase>();

    deleteEvidenceUseCase.execute.resolves({ status: "SUCCESS" });

    const evidenceAdaptor = new EvidenceAdaptor(
      uploadEvidenceValidator,
      uploadEvidenceUseCase,
      deleteEvidenceUseCase,
    );

    const app = express();
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

    app.use(express.json());
    app.use((req, _res, next) => {
      (req as unknown as { session: typeof sharedSession }).session =
        sharedSession;
      next();
    });

    const router = express.Router();
    app.use(createEvidenceRouter(router, evidenceAdaptor));

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
