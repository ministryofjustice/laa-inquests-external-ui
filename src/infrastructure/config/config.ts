import dotenv from "dotenv";
import { z } from "zod";
import type { Config } from "#src/infrastructure/config/config.types.js";

const DEFAULT_RATE_LIMIT_MAX = 10000;
const DEFAULT_RATE_WINDOW_MS_MINUTE = 15;
const MILLISECONDS_IN_A_MINUTE = 60000;
const DEFAULT_PORT = 3000;

const configSchema = z
  .object({
    SESSION_SECRET: z.string().optional(),
    SESSION_NAME: z.string().optional(),
    SESSION_LOG_SECRET: z.string().optional(),
    USE_REDIS: z.string().optional().default("true"),
    NODE_ENV: z.string().optional(),
    REDIS_HOST_NAME: z.string().optional(),
    REDIS_AUTH_TOKEN: z.string().optional(),
    DEV_SKIP_AUTH: z.string().optional(),
    AUTH_DIRECTORY_URL: z.string().optional(),
    AUTH_CLIENT_ID: z.string().optional(),
    AUTH_CLIENT_SECRET: z.string().optional(),
    AUTH_REDIRECT_URI: z.string().optional(),
    AUTH_POST_LOGOUT_URI: z.string().optional(),
    SENTRY_DSN: z.string().optional(),
    AUTH_TOKEN_DEBUG_ENABLED: z.string().optional(),
    SUBMIT_PAYLOAD_DEBUG_ENABLED: z.string().optional(),
    INQUESTS_API_CLIENT_ID: z.string().optional(),
    CONTACT_EMAIL: z.string().optional(),
    CONTACT_PHONE: z.string().optional(),
    DEPARTMENT_NAME: z.string().optional(),
    DEPARTMENT_URL: z.string().optional(),
    ENVIRONMENT: z.string().optional(),
    INQUESTS_API_URL: z.string().optional(),
    RATE_LIMIT_GLOBAL_MAX: z.string().optional(),
    RATE_LIMIT_IP_MAX: z.string().optional(),
    RATE_WINDOW_MS: z.string().optional(),
    SERVICE_NAME: z.string().optional(),
    SERVICE_URL: z.string().optional(),
    SILAS_HOMEPAGE: z.string().optional(),
    LOG_LEVEL: z.string().optional(),
    PORT: z.string().optional(),
    GA_MEASUREMENT_ID: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    const nodeEnv = env.NODE_ENV ?? "development";
    const isSkipAuthInDevelopment =
      nodeEnv === "development" && env.DEV_SKIP_AUTH === "true";

    if (isMissing(env.SESSION_SECRET) || isMissing(env.SESSION_NAME)) {
      ctx.addIssue({
        code: "custom",
        message:
          "SESSION_SECRET and SESSION_NAME must be defined in environment variables.",
      });
    }

    if (
      nodeEnv !== "test" &&
      (isMissing(env.SESSION_LOG_SECRET) ||
        env.SESSION_LOG_SECRET === "undefined")
    ) {
      ctx.addIssue({
        code: "custom",
        message: "SESSION_LOG_SECRET must be defined in environment variables.",
      });
    }

    const authVars = [
      "AUTH_DIRECTORY_URL",
      "AUTH_CLIENT_ID",
      "AUTH_CLIENT_SECRET",
      "AUTH_REDIRECT_URI",
      "AUTH_POST_LOGOUT_URI",
    ] as const;
    const hasMissingAuthVars = authVars.some((key) => isMissing(env[key]));

    if (!isSkipAuthInDevelopment && hasMissingAuthVars) {
      ctx.addIssue({
        code: "custom",
        message:
          "AUTH_DIRECTORY_URL, AUTH_CLIENT_ID, AUTH_CLIENT_SECRET, AUTH_REDIRECT_URI and AUTH_POST_LOGOUT_URI must be defined in environment variables.",
      });
    }

    validateRedisConfig(env, ctx);
    validateSentryConfig(env, ctx);
  });

type Environment = z.infer<typeof configSchema>;

function isMissing(value: string | undefined): boolean {
  return value === undefined || value === "";
}

function validateRedisConfig(env: Environment, ctx: z.RefinementCtx): void {
  const nodeEnv = env.NODE_ENV ?? "development";
  const useRedis = env.USE_REDIS !== "false";

  if (useRedis && nodeEnv !== "test" && isMissing(env.REDIS_HOST_NAME)) {
    ctx.addIssue({
      code: "custom",
      message: "REDIS_HOST_NAME must be defined in environment variables.",
    });
  }

  if (useRedis && nodeEnv === "production" && isMissing(env.REDIS_AUTH_TOKEN)) {
    ctx.addIssue({
      code: "custom",
      message: "REDIS_AUTH_TOKEN must be defined in environment variables.",
    });
  }
}

function validateSentryConfig(env: Environment, ctx: z.RefinementCtx): void {
  if (env.NODE_ENV === "production" && isMissing(env.SENTRY_DSN)) {
    ctx.addIssue({
      code: "custom",
      message: "SENTRY_DSN must be defined in environment variables.",
    });
  }
}

function handleZodError(error: unknown): never {
  if (error instanceof z.ZodError) {
    const { issues } = error;
    const issue = issues.find((item) => item.code === "custom");
    const [firstIssue] = issues;
    throw new Error(issue?.message ?? firstIssue.message, { cause: error });
  }
  // eslint-disable-next-line @typescript-eslint/only-throw-error -- Preserve unexpected non-Zod failures.
  throw error;
}

// eslint-disable-next-line complexity -- Config has many independent environment-derived properties.
export function createConfig(env: Record<string, string | undefined>): Config {
  const validated: Environment = (() => {
    try {
      return configSchema.parse(env);
    } catch (error) {
      handleZodError(error);
    }
  })();
  const nodeEnv = validated.NODE_ENV ?? "development";
  const serviceName = validated.SERVICE_NAME ?? "Legal aid at inquests";
  const useRedis = validated.USE_REDIS !== "false";
  const isSkipAuthInDevelopment =
    nodeEnv === "development" && validated.DEV_SKIP_AUTH === "true";

  return {
    AUTH_DIRECTORY_URL: validated.AUTH_DIRECTORY_URL ?? "",
    AUTH_CLIENT_ID: validated.AUTH_CLIENT_ID ?? "",
    AUTH_CLIENT_SECRET: validated.AUTH_CLIENT_SECRET ?? "",
    AUTH_REDIRECT_URI: validated.AUTH_REDIRECT_URI ?? "",
    AUTH_POST_LOGOUT_URI: validated.AUTH_POST_LOGOUT_URI ?? "",
    AUTH_SCOPES: [
      "openid",
      "profile",
      "offline_access",
      `api://${validated.INQUESTS_API_CLIENT_ID ?? ""}/User.Provider`,
    ],
    AUTH_TOKEN_DEBUG_ENABLED: validated.AUTH_TOKEN_DEBUG_ENABLED === "true",
    SUBMIT_PAYLOAD_DEBUG_ENABLED:
      validated.SUBMIT_PAYLOAD_DEBUG_ENABLED === "true",
    CONTACT_EMAIL: validated.CONTACT_EMAIL,
    CONTACT_PHONE: validated.CONTACT_PHONE,
    DEPARTMENT_NAME: validated.DEPARTMENT_NAME,
    DEPARTMENT_URL: validated.DEPARTMENT_URL,
    ENVIRONMENT: validated.ENVIRONMENT ?? "unknown",
    INQUESTS_API_CLIENT_ID: validated.INQUESTS_API_CLIENT_ID,
    INQUESTS_API_URL: validated.INQUESTS_API_URL ?? "",
    RATE_LIMIT_GLOBAL_MAX: Number(
      validated.RATE_LIMIT_GLOBAL_MAX ?? DEFAULT_RATE_LIMIT_MAX,
    ),
    RATE_LIMIT_IP_MAX: Number(
      validated.RATE_LIMIT_IP_MAX ?? DEFAULT_RATE_LIMIT_MAX,
    ),
    RATE_WINDOW_MS: Number(
      validated.RATE_WINDOW_MS ??
        DEFAULT_RATE_WINDOW_MS_MINUTE * MILLISECONDS_IN_A_MINUTE,
    ),
    SENTRY_DSN: validated.SENTRY_DSN ?? "",
    SERVICE_NAME: serviceName,
    SERVICE_PHASE: "Beta",
    SERVICE_URL: validated.SERVICE_URL,
    SILAS_HOMEPAGE: validated.SILAS_HOMEPAGE,
    LOG_LEVEL: validated.LOG_LEVEL,
    USE_REDIS: useRedis,
    REDIS_HOST_NAME: validated.REDIS_HOST_NAME ?? "",
    REDIS_AUTH_TOKEN: validated.REDIS_AUTH_TOKEN ?? "",
    SESSION_LOG_SECRET: validated.SESSION_LOG_SECRET ?? "",
    session: {
      secret: validated.SESSION_SECRET ?? "",
      name: validated.SESSION_NAME ?? "",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: nodeEnv === "production",
        httpOnly: true,
        sameSite: "lax",
      },
    },
    app: {
      port: Number(validated.PORT ?? DEFAULT_PORT),
      environment: nodeEnv,
      appName: serviceName,
      useHttps: nodeEnv === "production",
      skipAuthInDev: isSkipAuthInDevelopment,
    },
    csrf: {
      cookieName: "_csrf",
      secure: nodeEnv === "production",
      httpOnly: true,
    },
    paths: {
      static: "public",
      views: "src/views",
    },
    GA_MEASUREMENT_ID: validated.GA_MEASUREMENT_ID ?? "",
  };
}

dotenv.config({ path: "../.env.external" });
const config = createConfig(process.env);

export default config;
