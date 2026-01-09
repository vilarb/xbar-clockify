#!/usr/bin/env /usr/local/bin/node
import { loadEnv, EnvValidationError } from "../utils/env-loader.js";
import { clockIn } from "../api/clockify-api.js";
import { ClockifyAPIError, ClockifyNetworkError } from "../errors/clockify-error.js";
import notifier from "node-notifier";

try {
  loadEnv();
  await clockIn();

  // Show success notification
  notifier.notify({
    title: "Clockify",
    message: "Successfully clocked in",
    sound: "Glass",
  });
} catch (error) {
  let errorMessage = "Failed to clock in";

  if (error instanceof EnvValidationError) {
    errorMessage = `Configuration error: ${error.message.split("\n")[0]}`;
  } else if (error instanceof ClockifyAPIError) {
    if (error.statusCode === 401) {
      errorMessage = "Authentication failed. Check your API token.";
    } else if (error.statusCode === 400) {
      errorMessage = "Invalid request. You may already be clocked in.";
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

  console.error("Clock in failed:", error);
  process.exit(1);
}
