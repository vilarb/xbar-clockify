#!/usr/bin/env /usr/local/bin/node

import { fileURLToPath } from "url";
import { dirname, join, parse } from "path";
import dotenv from "dotenv";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function findEnvFile(startDir) {
  let currentDir = startDir;
  while (currentDir !== parse(currentDir).root) {
    const envPath = join(currentDir, ".env");
    if (existsSync(envPath)) {
      return envPath;
    }
    currentDir = dirname(currentDir);
  }
  return null;
}

const envPath = findEnvFile(__dirname);

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  console.warn("No .env file found in the project hierarchy.");
}

import { clockOut } from "../api.mjs";

await clockOut();
