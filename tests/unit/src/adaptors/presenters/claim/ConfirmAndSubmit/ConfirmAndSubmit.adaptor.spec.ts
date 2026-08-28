import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { Request, Response } from "express";
import { ConfirmAndSubmitAdaptor } from "#src/adaptors/presenters/claim/ConfirmAndSubmit/ConfirmAndSubmit.adaptor.js";
import { CLAIM_REJECTION_REASON_LABEL } from "#src/infrastructure/locales/constants.js";
import type { ClaimSubmitPort } from "#src/ports/source/inquests-api/SubmitClaim.port.js";
import { Formatter } from "#src/utils/Formatter.js";
import { SubmitClaimUseCase } from "#src/use-cases/claim/SubmitClaim.useCase.js";

describe("ConfirmAndSubmit adaptor", () => {
  let claimSubmitPort: StubbedInstance<ClaimSubmitPort>;
  let submitClaimUseCase: StubbedInstance<SubmitClaimUseCase>;
  let formatter: Formatter;
  let loggerMessages: string[];

  beforeEach(() => {
    claimSubmitPort = stubInterface<ClaimSubmitPort>();
    submitClaimUseCase = stubInterface<SubmitClaimUseCase>();
    formatter = new Formatter();
    loggerMessages = [];
  });
  describe("renderForm", () => {
    it("renders the confirm and submit view", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/check-your-answers");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
    });

    it("maps the case reference and claim answers from the session", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        caseReference: "ABC-12345",
        client: {
          reference: "ABC-12345",
          clientName: "Jane Smith",
          clientFirstName: "Jane",
          clientLastName: "Smith",
          dateOfBirth: "01/01/2000",
        },
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "EXPERT_COST",
      };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(viewModel.caseDetails.caseReference, "ABC-12345");
      assert.equal(viewModel.caseDetails.clientFirstName, "Jane");
      assert.equal(viewModel.caseDetails.clientLastName, "Smith");
      assert.equal(viewModel.caseDetails.clientDateOfBirth, "01/01/2000");
      assert.equal(
        viewModel.claimDetails.claimType,
        "Payment on account (POA)",
      );
      assert.equal(viewModel.claimDetails.claimSubtype, "Expert cost");
    });

    it("falls back to empty strings when the claim answers are not in the session", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(viewModel.caseDetails.caseReference, "");
      assert.equal(viewModel.caseDetails.clientFirstName, "");
      assert.equal(viewModel.caseDetails.clientLastName, "");
      assert.equal(viewModel.caseDetails.clientDateOfBirth, "");
      assert.equal(viewModel.claimDetails.claimType, "");
      assert.equal(viewModel.claimDetails.claimSubtype, "");
    });

    it("maps session cost values into formatted cost details", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        zeroVatTotal: "10",
        netTotal: "1000",
        grossTotal: "1200",
      };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(viewModel.cost.zeroVatTotal, "£10.00");
      assert.equal(viewModel.cost.netTotal, "£1,000.00");
      assert.equal(viewModel.cost.grossTotal, "£1,200.00");
    });

    it("returns None for cost details when session cost values are missing", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(viewModel.cost.zeroVatTotal, "None");
      assert.equal(viewModel.cost.netTotal, "None");
      assert.equal(viewModel.cost.grossTotal, "None");
      assert.deepEqual(viewModel.evidence.uploadedFiles, []);
    });

    it("does not show the counsel section when the claim is not a final bill", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        type: "NIL_BILL",
        counselNumber: "2",
        counselBillsPaid: true,
      };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(viewModel.counsel.show, false);
      assert.equal(viewModel.isFinalBill, false);
    });

    it("shows the counsel section with paid details when the claim is a final bill with counsel", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        type: "FINAL_BILL",
        counselNumber: "2",
        counselBillsPaid: true,
      };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(viewModel.counsel.show, true);
      assert.equal(viewModel.counsel.hasCounsel, true);
      assert.equal(viewModel.counsel.counselNumber, "2");
      assert.equal(viewModel.counsel.counselPaid, "Yes");
      assert.equal(viewModel.isFinalBill, true);
    });

    it("shows the counsel section without a paid row when a final bill has zero counsel", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        type: "FINAL_BILL",
        counselNumber: "0",
      };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(viewModel.counsel.show, true);
      assert.equal(viewModel.counsel.hasCounsel, false);
      assert.equal(viewModel.counsel.counselNumber, "0");
    });

    it("maps the 6 or more counsel value to a friendly label", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        type: "FINAL_BILL",
        counselNumber: "6_OR_MORE",
        counselBillsPaid: true,
      };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(viewModel.counsel.counselNumber, "6 or more");
    });

    it("maps uploaded evidence files from the session to view model rows", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        evidenceFiles: [
          { id: "evidence-id-1", fileName: "report.pdf", fileSize: 2048 },
          { id: "evidence-id-2", fileName: "photo.PNG" },
        ],
      };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.deepEqual(viewModel.evidence.uploadedFiles, [
        {
          id: "evidence-id-1",
          name: "report.pdf",
          type: "PDF",
          fileSize: "2KB",
        },
        {
          id: "evidence-id-2",
          name: "photo.PNG",
          type: "PNG",
          fileSize: "",
        },
      ]);
    });

    it("returns undefined costTemplateFile when no final bill template is in session", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(viewModel.costTemplateFile, undefined);
    });

    it("maps the uploaded final bill template from session to a view model row", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        finalBillCostTemplate: {
          costTemplateId: "template-id-1",
          costTemplateFilename: "cost-template.xlsx",
          costTemplateFileSize: 4096,
        },
      };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.deepEqual(viewModel.costTemplateFile, {
        id: "template-id-1",
        name: "cost-template.xlsx",
        type: "XLSX",
        fileSize: "4KB",
      });
    });
  });

  describe("inquest details", () => {
    it("maps the inquest outcomes and funding label into the view model", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        inquestOutcomes: ["ACCIDENT_OR_MISADVENTURE"],
        fundingPostInquest: "NO",
      };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(
        viewModel.inquestDetails.inquestOutcomes,
        "Accident or misadventure",
      );
      assert.equal(viewModel.inquestDetails.funding, "No");
      assert.equal(viewModel.inquestDetails.showRecovery, false);
    });

    it("shows the recovery details with labels and formatted amounts when funding is Yes", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        fundingPostInquest: "YES",
        recoveryCostMade: "YES",
        recoveryCosts: "100",
        recoveryDamages: "200",
        recoveryInterest: "300",
        recoveryPreCertificateCosts: "400",
        payingParty: "Acme Ltd",
      };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(viewModel.inquestDetails.showRecovery, true);
      assert.equal(viewModel.inquestDetails.funding, "Yes");
      assert.equal(viewModel.inquestDetails.recoveryCostMade, "Yes");
      assert.equal(viewModel.inquestDetails.recoveryCosts, "£100.00");
      assert.equal(viewModel.inquestDetails.recoveryDamages, "£200.00");
      assert.equal(viewModel.inquestDetails.recoveryInterest, "£300.00");
      assert.equal(
        viewModel.inquestDetails.recoveryPreCertificateCosts,
        "£400.00",
      );
      assert.equal(viewModel.inquestDetails.showFinancialRecoveryCosts, true);
      assert.equal(viewModel.inquestDetails.showPreCertificateCosts, false);
      assert.equal(viewModel.inquestDetails.payingParty, "Acme Ltd");
    });

    it("shows the pre-certificate costs and hides the financial recovery costs when recovery cost has not been made", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        fundingPostInquest: "YES",
        recoveryCostMade: "NO",
        preCertificateCosts: "400",
        payingParty: "Acme Ltd",
      };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(viewModel.inquestDetails.showRecovery, true);
      assert.equal(viewModel.inquestDetails.recoveryCostMade, "No");
      assert.equal(viewModel.inquestDetails.preCertificateCosts, "£400.00");
      assert.equal(viewModel.inquestDetails.showPreCertificateCosts, true);
      assert.equal(viewModel.inquestDetails.showFinancialRecoveryCosts, false);
    });

    it("shows the recovery details when funding is Don't know", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        fundingPostInquest: "DONT_KNOW",
      };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(viewModel.inquestDetails.showRecovery, true);
      assert.equal(viewModel.inquestDetails.funding, "Don't know");
    });

    it("falls back to empty strings when the inquest answers are not in the session", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(viewModel.inquestDetails.funding, "");
      assert.equal(viewModel.inquestDetails.recoveryCostMade, "");
      assert.equal(viewModel.inquestDetails.payingParty, "");
      assert.equal(viewModel.inquestDetails.showRecovery, false);
      assert.equal(viewModel.inquestDetails.showPreCertificateCosts, false);
      assert.equal(viewModel.inquestDetails.showFinancialRecoveryCosts, false);
    });
  });

  describe("processForm", () => {
    it("calls the submit claim use case with session data", async () => {
      submitClaimUseCase.execute.resolves({
        status: "SUCCESS",
        data: { claimId: 99 },
      });
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort, {
        submitClaim: submitClaimUseCase,
      });

      const responseStub = stubInterface<Response>();
      responseStub.status.returns(responseStub);
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = {
        caseReference: "1",
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "PROFIT_COST",
        zeroVatTotal: "10",
        netTotal: "1000",
        grossTotal: "1210",
        evidenceFiles: [
          { id: "evidence-id-1", fileName: "a.pdf" },
          { id: "evidence-id-2", fileName: "b.pdf" },
        ],
      };
      requestStub.session.providerEmail = "solicitor@firm.co.uk";
      requestStub.session.accessToken = "my-token";

      await adaptor.processForm(requestStub, responseStub);

      assert(submitClaimUseCase.execute.calledOnce);
      const [input] = submitClaimUseCase.execute.getCall(0).args;
      assert.equal(input.laaReference, "1");
      assert.equal(input.claimType, "PAYMENT_ON_ACCOUNT");
      assert.equal(input.poaTypeId, "PROFIT_COST");
      assert.equal(input.claimantId, "solicitor@firm.co.uk");
      assert.equal(input.accessToken, "my-token");
      assert.equal(input.zeroVatTotal, 10);
      assert.equal(input.netTotal, 1000);
      assert.equal(input.grossTotal, 1210);
      assert.deepEqual(input.claimEvidenceIds, [
        "evidence-id-1",
        "evidence-id-2",
      ]);
      assert.equal(input.hasCounselBeenPaid, null);
      assert.equal(input.hasAlternativeFunding, null);
      assert.equal(input.hasRecoveryCostsAwarded, null);
      assert.equal(input.financialRecoveryPreviousPreCertificateCosts, null);
      assert.equal(input.financialRecoveryCost, null);
      assert.equal(input.financialRecoveryDamages, null);
      assert.equal(input.financialRecoveryInterest, null);
      assert.equal(input.payingParty, null);
      assert.equal(input.numberOfCounselInstructed, null);
    });

    it("maps final bill fields into submit payload and keeps evidence ids separate from cost template", async () => {
      submitClaimUseCase.execute.resolves({
        status: "SUCCESS",
        data: { claimId: 99 },
      });
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort, {
        submitClaim: submitClaimUseCase,
      });

      const responseStub = stubInterface<Response>();
      responseStub.status.returns(responseStub);
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = {
        caseReference: "1",
        type: "FINAL_BILL",
        zeroVatTotal: "0",
        netTotal: "",
        grossTotal: "1200",
        evidenceFiles: [{ id: "evidence-id-1", fileName: "a.pdf" }],
        finalBillCostTemplate: {
          costTemplateId: "template-id-1",
          costTemplateFilename: "cost-template.xlsx",
        },
        inquestOutcomes: ["NATURAL_CAUSES"],
        counselNumber: "6_OR_MORE",
        counselBillsPaid: true,
        fundingPostInquest: "YES",
        recoveryCostMade: "YES",
        recoveryCosts: "100",
        recoveryDamages: "200",
        recoveryInterest: "300",
        recoveryPreCertificateCosts: "400",
        payingParty: "Acme Ltd",
      };
      requestStub.session.providerEmail = "test@provider.co.uk";

      await adaptor.processForm(requestStub, responseStub);

      const [input] = submitClaimUseCase.execute.getCall(0).args;
      assert.equal(input.claimType, "FINAL_BILL");
      assert.equal(input.poaTypeId, undefined);
      assert.equal(input.zeroVatTotal, undefined);
      assert.equal(input.netTotal, undefined);
      assert.equal(input.grossTotal, 1200);
      assert.deepEqual(input.claimEvidenceIds, ["evidence-id-1"]);
      assert.deepEqual(input.inquestOutcomes, ["NATURAL_CAUSES"]);
      assert.deepEqual(input.claimCostTemplateFile, {
        claimCostTemplateFileId: "template-id-1",
        claimCostTemplateFileName: "cost-template.xlsx",
      });
      assert.equal(input.hasCounselBeenPaid, true);
      assert.equal(input.hasAlternativeFunding, true);
      assert.equal(input.hasRecoveryCostsAwarded, true);
      assert.equal(input.financialRecoveryPreviousPreCertificateCosts, 400);
      assert.equal(input.financialRecoveryCost, 100);
      assert.equal(input.financialRecoveryDamages, 200);
      assert.equal(input.financialRecoveryInterest, 300);
      assert.equal(input.payingParty, "Acme Ltd");
      assert.equal(input.numberOfCounselInstructed, "MORE_THAN_6");
    });

    it("excludes leftover POA cost values when submitting a final bill", async () => {
      submitClaimUseCase.execute.resolves({
        status: "SUCCESS",
        data: { claimId: 99 },
      });
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort, {
        submitClaim: submitClaimUseCase,
      });

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = {
        caseReference: "1",
        type: "FINAL_BILL",
        zeroVatTotal: "10",
        netTotal: "1000",
        grossTotal: "500",
        evidenceFiles: [{ id: "e1", fileName: "a.pdf" }],
        counselNumber: "2",
        counselBillsPaid: true,
        fundingPostInquest: "NO",
        inquestOutcomes: ["NATURAL_CAUSES"],
      };

      await adaptor.processForm(requestStub, responseStub);

      const [input] = submitClaimUseCase.execute.getCall(0).args;
      assert.equal(input.zeroVatTotal, undefined);
      assert.equal(input.netTotal, undefined);
      assert.equal(input.grossTotal, 500);
      assert.equal(input.claimCostTemplateFile, null);
    });

    it("classifies a final bill as NIL_BILL and omits POA and evidence fields when the gross total entered is £0", async () => {
      submitClaimUseCase.execute.resolves({
        status: "SUCCESS",
        data: { claimId: 99 },
      });
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort, {
        submitClaim: submitClaimUseCase,
      });

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = {
        caseReference: "1",
        type: "FINAL_BILL",
        grossTotal: "0",
        inquestOutcomes: ["NATURAL_CAUSES"],
        fundingPostInquest: "NO",
      };

      await adaptor.processForm(requestStub, responseStub);

      const [input] = submitClaimUseCase.execute.getCall(0).args;
      assert.equal(input.claimType, "NIL_BILL");
      assert.equal(input.poaTypeId, undefined);
      assert.equal(input.zeroVatTotal, undefined);
      assert.equal(input.netTotal, undefined);
      assert.equal(input.grossTotal, 0);
      assert.equal(input.claimCostTemplateFile, null);
      assert.deepEqual(input.claimEvidenceIds, []);
    });

    it("defaults hasRecoveryCostsAwarded to false when funding is NO and recovery was never asked", async () => {
      submitClaimUseCase.execute.resolves({
        status: "SUCCESS",
        data: { claimId: 99 },
      });
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort, {
        submitClaim: submitClaimUseCase,
      });

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = {
        caseReference: "1",
        type: "FINAL_BILL",
        grossTotal: "500",
        evidenceFiles: [{ id: "e1", fileName: "a.pdf" }],
        counselNumber: "2",
        counselBillsPaid: true,
        fundingPostInquest: "NO",
        inquestOutcomes: ["NATURAL_CAUSES"],
      };

      await adaptor.processForm(requestStub, responseStub);

      const [input] = submitClaimUseCase.execute.getCall(0).args;
      assert.equal(input.hasAlternativeFunding, false);
      assert.equal(input.hasRecoveryCostsAwarded, false);
      assert.equal(input.financialRecoveryPreviousPreCertificateCosts, 0);
      assert.equal(input.financialRecoveryCost, 0);
      assert.equal(input.financialRecoveryDamages, 0);
      assert.equal(input.financialRecoveryInterest, 0);
      assert.equal(input.payingParty, "");
      assert.equal(input.numberOfCounselInstructed, "2");
    });

    it("defaults claimEvidenceIds to an empty array when no evidence files are in session", async () => {
      submitClaimUseCase.execute.resolves({
        status: "SUCCESS",
        data: { claimId: 99 },
      });
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort, {
        submitClaim: submitClaimUseCase,
      });

      const responseStub = stubInterface<Response>();
      responseStub.status.returns(responseStub);
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = {
        caseReference: "1",
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "PROFIT_COST",
      };

      await adaptor.processForm(requestStub, responseStub);

      assert(submitClaimUseCase.execute.calledOnce);
      const [input] = submitClaimUseCase.execute.getCall(0).args;
      assert.deepEqual(input.claimEvidenceIds, []);
    });

    it("defaults poaTypeId to null when no subtype is in session", async () => {
      submitClaimUseCase.execute.resolves({
        status: "SUCCESS",
        data: { claimId: 99 },
      });
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort, {
        submitClaim: submitClaimUseCase,
      });

      const responseStub = stubInterface<Response>();
      responseStub.status.returns(responseStub);
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = {
        caseReference: "1",
        type: "PAYMENT_ON_ACCOUNT",
      };

      await adaptor.processForm(requestStub, responseStub);

      assert(submitClaimUseCase.execute.calledOnce);
      const [input] = submitClaimUseCase.execute.getCall(0).args;
      assert.equal(input.poaTypeId, null);
    });

    it("stores the claimReferenceNumber in the session and redirects to the confirmation page on success", async () => {
      submitClaimUseCase.execute.resolves({
        status: "SUCCESS",
        data: { claimId: 42 },
      });
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort, {
        submitClaim: submitClaimUseCase,
      });

      const responseStub = stubInterface<Response>();
      responseStub.status.returns(responseStub);
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = {
        caseReference: "1",
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "PROFIT_COST",
        zeroVatTotal: "0",
        netTotal: "1000",
        grossTotal: "1200",
      };
      requestStub.session.providerEmail = "test@provider.co.uk";
      requestStub.session.accessToken = "my-token";

      await adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claimReferenceNumber, "42");
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/confirmation/success");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("redirects to the rejected confirmation page when submission succeeds with rejection reasons", async () => {
      submitClaimUseCase.execute.resolves({
        status: "SUCCESS",
        data: {
          claimId: 42,
          rejectionReasons: ["MAX_POA_CLAIMS_EXCEEDED"],
        },
      });
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort, {
        submitClaim: submitClaimUseCase,
      });

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = {
        caseReference: "1",
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "PROFIT_COST",
      };

      await adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claimReferenceNumber, "42");
      assert.deepEqual(requestStub.session.claimRejectionReasons, [
        "MAX_POA_CLAIMS_EXCEEDED",
      ]);
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/confirmation/reject");
    });

    it("re-renders the check-your-answers page with error summaries when the use case returns VALIDATION_FAILED", async () => {
      submitClaimUseCase.execute.resolves({
        status: "VALIDATION_FAILED",
        errorSummaries: {
          submitError: {
            text: "Net total cannot be higher than the gross total value",
          },
        },
      });
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort, {
        submitClaim: submitClaimUseCase,
      });

      const responseStub = stubInterface<Response>();
      responseStub.locals = { csrfToken: "test-token" };
      const requestStub = stubInterface<Request>();

      await adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/check-your-answers");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.deepEqual(viewModel.errorSummaries, {
        submitError: {
          text: "Net total cannot be higher than the gross total value",
        },
      });
      assert.equal(responseStub.redirect.callCount, 0);
    });

    it("redirects to the global error route when the use case returns TECHNICAL_FAILURE", async () => {
      submitClaimUseCase.execute.resolves({
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      });
      const adaptor = new ConfirmAndSubmitAdaptor(
        formatter,
        claimSubmitPort,
        {
          submitClaim: submitClaimUseCase,
        },
        (message) => {
          loggerMessages.push(message);
        },
      );

      const responseStub = stubInterface<Response>();
      responseStub.status.returns(responseStub);
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = {
        caseReference: "1",
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "PROFIT_COST",
      };

      await adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/error");
      assert.equal(responseStub.status.callCount, 0);
      assert.equal(responseStub.render.callCount, 0);
      assert.equal(loggerMessages.length, 1);
      assert.equal(
        loggerMessages[0],
        JSON.stringify({
          event: "submit.claim.error",
          reason: "UNEXPECTED_EXCEPTION",
        }),
      );
    });
  });

  describe("renderConfirmSuccess", () => {
    it("renders the claim confirmation success view with the claim reference number from the session", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claimReferenceNumber = "99";
      requestStub.session.claim = { type: "PAYMENT_ON_ACCOUNT" };

      adaptor.renderConfirmSuccess(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/confirm-success");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.claimReferenceNumber, "99");
      assert.equal(viewModel.claimTypeHeading, "Payment on account");
    });

    it("renders the final bill claim type heading", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { type: "FINAL_BILL" };

      adaptor.renderConfirmSuccess(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0).args[1] as unknown as {
        claimTypeHeading: string;
      };
      assert.equal(viewModel.claimTypeHeading, "Final bill");
    });

    it("renders the final bill claim type heading for a nil bill claim", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { type: "FINAL_BILL", subtype: "NIL_BILL" };

      adaptor.renderConfirmSuccess(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0).args[1] as unknown as {
        claimTypeHeading: string;
      };
      assert.equal(viewModel.claimTypeHeading, "Final bill");
    });
  });

  describe("renderConfirmReject", () => {
    it("renders the claim rejection view with mapped rejection reason descriptions", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claimRejectionReasons = [
        "MAX_POA_CLAIMS_EXCEEDED",
        "CLAIM_EXCEEDS_SUBSTANTIVE_COST_LIMIT",
      ];
      requestStub.session.claim = { type: "PAYMENT_ON_ACCOUNT" };

      adaptor.renderConfirmReject(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/confirm-reject");
      const viewModel = renderArgs[1] as unknown as {
        csrfToken: string;
        rejectionReasonDescriptions: string[];
        claimTypeHeading: string;
      };
      assert.equal(viewModel.csrfToken, "test-token");
      assert.deepEqual(viewModel.rejectionReasonDescriptions, [
        CLAIM_REJECTION_REASON_LABEL.MAX_POA_CLAIMS_EXCEEDED,
        CLAIM_REJECTION_REASON_LABEL.CLAIM_EXCEEDS_SUBSTANTIVE_COST_LIMIT,
      ]);
      assert.equal(viewModel.claimTypeHeading, "Payment on account");
    });

    it("falls back to showing the raw rejection reason code when it is unknown", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(formatter, claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claimRejectionReasons = ["UNKNOWN_REASON_CODE"];
      requestStub.session.claim = { type: "FINAL_BILL" };

      adaptor.renderConfirmReject(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0).args[1] as unknown as {
        rejectionReasonDescriptions: string[];
        claimTypeHeading: string;
      };

      assert.deepEqual(viewModel.rejectionReasonDescriptions, [
        "UNKNOWN_REASON_CODE",
      ]);
      assert.equal(viewModel.claimTypeHeading, "Final bill");
    });
  });
});
