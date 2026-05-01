import type { Session, SessionData } from "express-session";
import type { AxiosInstanceWrapper } from "#src/infrastructure/express/middleware/axios/index.types.js";
import type { ExpressLocaleLoader } from "#src/infrastructure/express/middleware/nunjucks/i18nLoader.js";

declare global {
  namespace Express {
    interface Request {
      axiosMiddleware: AxiosInstanceWrapper;
      locale: ExpressLocaleLoader;
      locals: {
        csrfToken?: string;
      };
      session: Session & Partial<SessionData>
    }
  }
}

export interface TypedRequestBody<T> extends Express.Request {
  body: T;
}
