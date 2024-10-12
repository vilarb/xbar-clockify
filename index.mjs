#!/usr/bin/env /usr/local/bin/node

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env") });

import xbar, { separator } from "xbar";
import { getTimeEntries } from "./api.mjs";

const timeEntries = await getTimeEntries();
const todayTimeEntries = timeEntries.filter((entry) => entry.timeInterval.start.startsWith(new Date().toISOString().split("T")[0]));

const isWorking = todayTimeEntries.some((entry) => !entry.timeInterval.end);

// Calculate total time worked today
const timeWorking = todayTimeEntries.reduce((total, entry) => {
  const start = new Date(entry.timeInterval.start);
  const end = entry.timeInterval.end ? new Date(entry.timeInterval.end) : new Date();
  return total + (end - start);
}, 0);

// Convert milliseconds to hours and minutes
const hours = Math.floor(timeWorking / 3600000);
const minutes = Math.floor((timeWorking % 3600000) / 60000);

// Print the status
let text,
  color = "#FFFFFF";
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
    text = `Not working`;
  }
}

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
]);
