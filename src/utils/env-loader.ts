import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", "..", ".env") });

// Type-safe environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_TOKEN: string;
      BASE_URL: string;
      WORKSPACE_ID: string;
      MY_USER_ID: string;
      PROJECT_ID: string;
      COMPANY_NETWORK?: string; // Optional, only needed for network notifications
    }
  }
}

// Required environment variables (COMPANY_NETWORK is optional)
const REQUIRED_ENV_VARS = ["API_TOKEN", "WORKSPACE_ID", "MY_USER_ID", "PROJECT_ID", "BASE_URL"] as const;

export class EnvValidationError extends Error {
  constructor(message: string, public missingVars: string[]) {
    super(message);
    this.name = "EnvValidationError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EnvValidationError);
    }
  }
}

export function loadEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key] || process.env[key]!.trim() === "");

  if (missing.length > 0) {
    throw new EnvValidationError(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        `Please check your .env file. Required variables:\n` +
        `  ${REQUIRED_ENV_VARS.join("\n  ")}\n` +
        `Optional variables:\n` +
        `  COMPANY_NETWORK (for automatic clock-in notifications)`,
      missing
    );
  }

  // Validate BASE_URL format
  if (process.env.BASE_URL && !process.env.BASE_URL.match(/^https?:\/\//)) {
    throw new EnvValidationError(`Invalid BASE_URL format. Must start with http:// or https://\n` + `Current value: ${process.env.BASE_URL}`, []);
  }
}
