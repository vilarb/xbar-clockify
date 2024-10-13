import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
      COMPANY_NETWORK: string;
    }
  }
}

export function loadEnv() {
  // This function doesn't need to do anything extra
  // since dotenv.config() is called when the module is imported
}
