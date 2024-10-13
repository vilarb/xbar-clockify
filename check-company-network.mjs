// Import required modules
import notifier from "node-notifier";
import path from "path";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { exec } from "child_process";
import { clockIn } from "./api.mjs";
import fs from "fs/promises";

// Function to notify user to clock in when connected to company network
export const notifyClockIn = async () => {
  // Function to get the current WiFi network name
  const getWifiName = () => {
    return new Promise((resolve, reject) => {
      // Execute command to get WiFi network name
      exec("networksetup -getairportnetwork en0", (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          reject(error);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          reject(stderr);
          return;
        }
        // Extract and return the network name
        resolve(stdout.split(":").pop().trim());
      });
    });
  };
  // Get the current network name
  const network = await getWifiName();

  // Check if connected to the company network
  if (network === process.env.COMPANY_NETWORK) {
    // Get the current file's directory
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Show notification to clock in
    notifier.notify({
      title: `Connected to ${network} network`,
      message: `Looks like you just connected to ${network}. Do you want to clock in?`,
      icon: "Terminal Icon",
      sound: "Blow",
      wait: true,
      closeLabel: "Dismiss",
      actions: "Clock in",
    });

    // Call the clockIn function when user clicks on the notification
    notifier.on("click", function (notifierObject, options, event) {
      clockIn();
    });
  }
};

// Function to check and update the lock file
export const checkAndUpdateLock = async () => {
  // Get the current file's directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // Define the lock file path and duration
  const LOCK_FILE = join(__dirname, ".notify_lock");
  const LOCK_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

  try {
    // Get the stats of the lock file
    const stats = await fs.stat(LOCK_FILE);
    const now = new Date();

    // Check if the lock duration has passed
    if (now - stats.mtime > LOCK_DURATION) {
      // If so, update the lock file
      await fs.writeFile(LOCK_FILE, "");
      return true; // Indicate that the lock was updated
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      // If the lock file doesn't exist, create it
      await fs.writeFile(LOCK_FILE, "");
      return true; // Indicate that a new lock was created
    }
  }
  return false; // Indicate that the lock was not updated or created
};
