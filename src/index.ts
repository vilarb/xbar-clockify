#!/usr/bin/env /usr/local/bin/node
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { loadEnv } from "./utils/env-loader.js";
loadEnv();

import { XbarOptionsFixed } from "./types/xbar";
import { notifyClockIn, checkAndUpdateLock } from "./utils/check-company-network.js";

import xbar, { separator } from "xbar";
import { getTimeEntries } from "./api/clockify-api.js";

const timeEntries = await getTimeEntries();
const todayTimeEntries = timeEntries.filter((entry: any) => entry.timeInterval.start.startsWith(new Date().toISOString().split("T")[0]));

const isWorking = todayTimeEntries.some((entry: any) => !entry.timeInterval.end);

// Calculate total time worked today
const timeWorking = todayTimeEntries.reduce((total: number, entry: any) => {
  const start = new Date(entry.timeInterval.start);
  const end = entry.timeInterval.end ? new Date(entry.timeInterval.end) : new Date();
  return total + (end.getTime() - start.getTime());
}, 0);

// Convert milliseconds to hours and minutes
const hours = Math.floor(timeWorking / 3600000);
const minutes = Math.floor((timeWorking % 3600000) / 60000);

if (!isWorking && (await checkAndUpdateLock())) {
  notifyClockIn();
}

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
    text = `Out of office`;
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
] as XbarOptionsFixed[]);
