#!/usr/bin/env /usr/local/bin/node
import { loadEnv, EnvValidationError } from "../utils/env-loader.js";
import { clockOut } from "../api/clockify-api.js";
import { ClockifyAPIError, ClockifyNetworkError } from "../errors/clockify-error.js";
import notifier from "node-notifier";

try {
  loadEnv();
  await clockOut();

  // Show success notification
  notifier.notify({
    title: "Clockify",
    message: "Successfully clocked out",
    sound: "Glass",
  });
} catch (error) {
  let errorMessage = "Failed to clock out";

  if (error instanceof EnvValidationError) {
    errorMessage = `Configuration error: ${error.message.split("\n")[0]}`;
  } else if (error instanceof ClockifyAPIError) {
    if (error.statusCode === 401) {
      errorMessage = "Authentication failed. Check your API token.";
    } else if (error.statusCode === 404) {
      errorMessage = "No active time entry found to clock out.";
    } else {
      errorMessage = `API error: ${error.message}`;
    }
  } else if (error instanceof ClockifyNetworkError) {
    errorMessage = "Network error. Please check your connection.";
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  // Show error notification
  notifier.notify({
    title: "Clockify Error",
    message: errorMessage,
    sound: "Basso",
  });

  console.error("Clock out failed:", error);
  process.exit(1);
}
