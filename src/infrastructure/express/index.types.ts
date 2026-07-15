import type { Session, SessionData } from "express-session";
import type { ExpressLocaleLoader } from "#src/infrastructure/express/middleware/nunjucks/i18nLoader.js";

declare global {
  namespace Express {
    interface Request {
      locale: ExpressLocaleLoader;
      locals: {
        csrfToken?: string;
      };
      session: Session & Partial<SessionData>;
    }
  }
}

export interface TypedRequestBody<T> extends Express.Request {
  body: T;
}
