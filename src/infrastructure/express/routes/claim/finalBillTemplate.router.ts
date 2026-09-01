import type { Request, Response, Router } from "express";
import type { FinalBillTemplateAdaptor } from "#src/adaptors/presenters/claim/FinalBillTemplate/FinalBillTemplate.adaptor.js";
import { registerFileUploadRoutes } from "./fileUploadRoutes.shared.js";

export function createFinalBillTemplateRouter(
  finalBillTemplateRouter: Router,
  finalBillTemplateAdaptor: FinalBillTemplateAdaptor,
): Router {
  return registerFileUploadRoutes(finalBillTemplateRouter, {
    basePath: "/final-bill-template",
    renderForm: (req: Request, res: Response): void => {
      finalBillTemplateAdaptor.renderForm(req, res);
    },
    processForm: (req: Request, res: Response): void => {
      finalBillTemplateAdaptor.processForm(req, res);
    },
    processUpload: async (req: Request, res: Response): Promise<void> => {
      await finalBillTemplateAdaptor.processTemplateUpload(req, res);
    },
    processDelete: async (req: Request, res: Response): Promise<void> => {
      await finalBillTemplateAdaptor.processTemplateDelete(req, res);
    },
  });
}
