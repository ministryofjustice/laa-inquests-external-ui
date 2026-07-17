import config from "#src/infrastructure/config/config.js";
import type { Request } from "express";
import type {
  LogLevel,
  OpenSearchLog,
} from "#src/infrastructure/express/middleware/logger/opensearchlog.types.js";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";

const CORRELATION_ID_START = 0;
const CORRELATION_ID_LENGTH = 36;

interface LogContext {
  correlationId: string | undefined;
  userId: string | undefined;
}

function extractContext(
  request: Request | TypedRequestBody<unknown> | undefined,
): LogContext {
  if (request === undefined) {
    return { correlationId: "server", userId: "none" };
  }
  return {
    correlationId: (request.session.idToken as string | undefined)?.substring(
      CORRELATION_ID_START,
      CORRELATION_ID_LENGTH,
    ),
    userId: request.session.userId,
  };
}

class Logger {
  public logInfo = (
    functionName: string,
    message: string,
    request?: Request | TypedRequestBody<unknown>,
  ): void => {
    const context = extractContext(request);
    console.log(buildMessage(functionName, message, "info", context));
  };

  public logError = (
    functionName: string,
    message: string,
    err?: unknown,
    request?: Request | TypedRequestBody<unknown>,
  ): void => {
    const context = extractContext(request);
    console.error(
      buildMessage(
        functionName,
        `${message} - Error: ${this.#getErrorMessage(err)}`,
        "error",
        context,
      ),
    );
  };

  #getErrorMessage(err: unknown): string {
    if (typeof err === "string") {
      return err;
    } else if (err instanceof Error) {
      return err.message;
    } else {
      return "Missing Error Message";
    }
  }
}

function buildMessage(
  functionName: string,
  message: string,
  logLevel: LogLevel,
  context: LogContext,
): string | OpenSearchLog {
  const { correlationId, userId } = context;
  if (
    config.app.environment === "development" ||
    config.app.environment === "test"
  ) {
    return `[${new Date().toISOString()}] - ${logLevel.toUpperCase()} - [Function: '${functionName}'] - [CorID: ${correlationId}] - [UserId: ${userId}] - ${message}`;
  }

  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level: logLevel,
    serviceName: config.SERVICE_NAME,
    environment: config.app.environment,
    correlationId,
    message,
    context: {
      ...(userId === undefined ? {} : { userId }),
      functionName,
    },
  });
}

export const logger = new Logger();
export { Logger };
