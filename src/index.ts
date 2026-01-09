#!/usr/bin/env /usr/local/bin/node
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { loadEnv, EnvValidationError } from "./utils/env-loader.js";
import { XbarOptionsFixed } from "./types/xbar.js";
import { notifyClockIn, checkAndUpdateLock } from "./utils/check-company-network.js";
import { ClockifyAPIError, ClockifyNetworkError } from "./errors/clockify-error.js";
import type { TimeEntry } from "./types/clockify.js";

import xbar, { separator } from "xbar";
import { getTimeEntries } from "./api/clockify-api.js";

// Helper function to get today's date string in local timezone
const getTodayLocalDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper function to check if a time entry is from today (in local timezone)
const isTodayEntry = (entry: TimeEntry): boolean => {
  const entryDate = new Date(entry.timeInterval.start);
  const entryDateString = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}-${String(entryDate.getDate()).padStart(2, "0")}`;
  return entryDateString === getTodayLocalDateString();
};

// Helper function to calculate total time worked
const calculateTotalTime = (entries: TimeEntry[]): number => {
  const now = new Date();
  return entries.reduce((total, entry) => {
    const start = new Date(entry.timeInterval.start);
    const end = entry.timeInterval.end ? new Date(entry.timeInterval.end) : now;
    return total + (end.getTime() - start.getTime());
  }, 0);
};

// Helper function to format time display
const formatTimeDisplay = (milliseconds: number): { hours: number; minutes: number } => {
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  return { hours, minutes };
};

// Main execution
try {
  // Load and validate environment variables
  loadEnv();

  // Fetch time entries from API
  const timeEntries = await getTimeEntries();

  // Filter entries for today using local timezone
  const todayTimeEntries = timeEntries.filter(isTodayEntry);

  // Check if user is currently working (has an active time entry)
  const isWorking = todayTimeEntries.some((entry) => !entry.timeInterval.end);

  // Calculate total time worked today
  const timeWorking = calculateTotalTime(todayTimeEntries);
  const { hours, minutes } = formatTimeDisplay(timeWorking);

  // Check for company network and notify if needed (only if not working)
  if (!isWorking) {
    try {
      if (await checkAndUpdateLock()) {
        // Don't await to avoid blocking the menu display
        notifyClockIn().catch((error) => {
          console.error("Error in notification check:", error);
        });
      }
    } catch (error) {
      // Log but don't fail if network check fails
      console.error("Error checking company network:", error);
    }
  }

  // Generate display text and color
  let text: string;
  let color = "#FFFFFF";

  if (isWorking) {
    if (hours < 8) {
      text = `Working: ${hours}h ${minutes}m 🟡`;
    } else {
      text = `Working: ${hours}h ${minutes}m 🟢`;
    }
  } else {
    color = "#777777";
    if (hours > 8) {
      text = `Finished: ${hours}h ${minutes}m 🟢`;
    } else if (minutes > 0 || hours > 0) {
      text = `Not working: ${hours}h ${minutes}m`;
    } else {
      text = `Out of office`;
    }
  }

  // Generate and display menu
  xbar([
    {
      text,
      color,
      dropdown: false,
    },
    separator,
    {
      text: "Clock in",
      shell: `${join(__dirname, "actions", "clock_in.sh")}`,
      refresh: true,
      disabled: isWorking,
    },
    {
      text: "Clock out",
      shell: `${join(__dirname, "actions", "clock_out.sh")}`,
      refresh: true,
      disabled: !isWorking,
    },
    separator,
    {
      text: "Check my time",
      href: `https://app.clockify.me/tracker`,
    },
  ] as XbarOptionsFixed[]);
} catch (error) {
  // Handle different types of errors appropriately
  let errorText = "Error";
  let errorColor = "#FF0000"; // Red color for errors

  if (error instanceof EnvValidationError) {
    errorText = `Config Error: ${error.message.split("\n")[0]}`;
  } else if (error instanceof ClockifyAPIError) {
    if (error.statusCode === 401) {
      errorText = "Auth Error: Invalid API token";
    } else if (error.statusCode === 404) {
      errorText = "API Error: Resource not found";
    } else if (error.statusCode) {
      errorText = `API Error: ${error.statusCode}`;
    } else {
      errorText = `API Error: ${error.message}`;
    }
  } else if (error instanceof ClockifyNetworkError) {
    errorText = "Network Error: Check connection";
  } else if (error instanceof Error) {
    errorText = `Error: ${error.message}`;
  } else {
    errorText = "Unknown error occurred";
  }

  // Display error in menu
  xbar([
    {
      text: errorText,
      color: errorColor,
      dropdown: false,
    },
    separator,
    {
      text: "Check configuration",
      shell: `open ${join(process.cwd(), ".env")}`,
    },
    {
      text: "Refresh",
      refresh: true,
    },
  ] as XbarOptionsFixed[]);

  // Also log to console for debugging
  console.error("xbar-clockify error:", error);

  // Exit with error code
  process.exit(1);
}
