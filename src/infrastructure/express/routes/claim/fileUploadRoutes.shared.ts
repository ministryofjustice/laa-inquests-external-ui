import type { Request, Response, Router } from "express";

interface FileUploadRouteConfig {
  basePath: string;
  renderForm: (req: Request, res: Response) => void;
  processForm: (req: Request, res: Response) => void;
  processUpload: (req: Request, res: Response) => Promise<void>;
  processDelete: (req: Request, res: Response) => Promise<void>;
  viewFile?: (req: Request, res: Response) => Promise<void>;
  downloadFile?: (req: Request, res: Response) => Promise<void>;
}

export function registerFileUploadRoutes(
  router: Router,
  config: FileUploadRouteConfig,
): Router {
  const {
    basePath,
    renderForm,
    processForm,
    processUpload,
    processDelete,
    viewFile,
    downloadFile,
  } = config;

  router.get(basePath, (req: Request, res: Response): void => {
    renderForm(req, res);
  });

  router.post(basePath, (req: Request, res: Response): void => {
    processForm(req, res);
  });

  router.post(
    `${basePath}/upload`,
    async (req: Request, res: Response): Promise<void> => {
      await processUpload(req, res);
    },
  );

  router.post(
    `${basePath}/delete`,
    async (req: Request, res: Response): Promise<void> => {
      await processDelete(req, res);
    },
  );

  if (viewFile !== undefined) {
    router.get(
      `${basePath}/:evidenceId/view`,
      async (req: Request, res: Response): Promise<void> => {
        await viewFile(req, res);
      },
    );
  }

  if (downloadFile !== undefined) {
    router.get(
      `${basePath}/:evidenceId/download`,
      async (req: Request, res: Response): Promise<void> => {
        await downloadFile(req, res);
      },
    );
  }

  return router;
}
