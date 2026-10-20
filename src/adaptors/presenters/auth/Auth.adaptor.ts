import type { Request, Response, NextFunction } from "express";
import { promisify } from "node:util";
import type { AuthPort } from "#src/ports/auth/Auth.port.js";
import { startSessionLifetime } from "#src/infrastructure/express/session/sessionExpiry.js";
import config from "#src/infrastructure/config/config.js";

export class AuthAdaptor {
  constructor(
    private readonly authPort: AuthPort,
    private readonly redirectUri: string,
    private readonly postLogoutUri: string,
    private readonly authScopes: string[],
  ) {}

  async login(_req: Request, res: Response): Promise<void> {
    const url = await this.authPort.getAuthCodeUrl(
      this.authScopes,
      this.redirectUri,
    );
    res.redirect(url);
  }

  async callback(req: Request, res: Response): Promise<void> {
    const { code } = req.query as { code: string };

    const user = await this.authPort.acquireTokenByCode(
      code,
      this.authScopes,
      this.redirectUri,
    );
    await this.#regenerateSession(req);
    const { session } = req;
    startSessionLifetime(session, user.accessTokenExpiresOn, Date.now());
    Object.assign(session, {
      userId: user.userId,
      firmId: user.firmId,
      firmName: user.firmName,
      userOfficeAccounts: user.userOfficeAccounts,
      providerEmail: user.providerEmail,
      accessToken: user.accessToken,
      roles: user.roles,
    });
    session.user = { name: user.userName };
    res.redirect("/");
  }

  logout(req: Request, res: Response, next: NextFunction): void {
    req.session.destroy((err) => {
      res.clearCookie(config.session.name);
      if (err !== undefined && err !== null) {
        next(err);
        return;
      }

      const url = `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=${this.postLogoutUri}`;
      res.redirect(url);
    });
  }

  // Prevents session fixation by issuing a new session id at login.
  async #regenerateSession(req: Request): Promise<void> {
    await promisify((callback: (err: unknown) => void): void => {
      req.session.regenerate(callback);
    })();
  }
}
