// Import required modules
import notifier from "node-notifier";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";
import { clockIn } from "../api/clockify-api.js";
import fs from "fs/promises";

const execAsync = promisify(exec);

// Track if notification listener is already registered to prevent memory leaks
let notificationListenerRegistered = false;
let notificationListener: ((notifierObject: unknown, options: unknown, event: string) => void) | null = null;

// Function to get the active network interface name dynamically
const getActiveNetworkInterface = async (): Promise<string | null> => {
  try {
    // First, try to list all network services and find the active WiFi interface
    const { stdout } = await execAsync("networksetup -listallhardwareports");

    // Look for Wi-Fi or AirPort interfaces
    const lines = stdout.split("\n");
    let currentInterface = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes("Hardware Port:") && (line.includes("Wi-Fi") || line.includes("AirPort"))) {
        // Next line should contain the device name
        if (i + 1 < lines.length) {
          const deviceLine = lines[i + 1].trim();
          const match = deviceLine.match(/^Device: (.+)$/);
          if (match && match[1]) {
            currentInterface = match[1];
            break;
          }
        }
      }
    }

    if (!currentInterface) {
      // Fallback: try common interface names
      const commonInterfaces = ["en0", "en1", "en2"];
      for (const iface of commonInterfaces) {
        try {
          await execAsync(`networksetup -getairportnetwork ${iface}`);
          return iface;
        } catch {
          // Try next interface
          continue;
        }
      }
      return null;
    }

    return currentInterface;
  } catch (error) {
    console.error("Error detecting network interface:", error);
    // Fallback to en0
    return "en0";
  }
};

// Function to get the current WiFi network name
const getWifiName = async (): Promise<string | null> => {
  try {
    const interfaceName = await getActiveNetworkInterface();
    if (!interfaceName) {
      return null;
    }

    try {
      const { stdout } = await execAsync(`networksetup -getairportnetwork ${interfaceName}`);
      // Extract and return the network name
      const networkName = stdout.split(":").pop()?.trim() || null;
      return networkName;
    } catch (error: any) {
      // If command fails (e.g., not connected to WiFi), return null
      if (error.code === 1 || error.stderr?.includes("not associated")) {
        return null;
      }
      throw error;
    }
  } catch (error) {
    console.error("Error getting WiFi name:", error);
    return null;
  }
};

// Function to notify user to clock in when connected to company network
export const notifyClockIn = async (): Promise<void> => {
  // Check if COMPANY_NETWORK is configured
  if (!process.env.COMPANY_NETWORK) {
    return; // Silently skip if not configured
  }

  // Remove previous listener if it exists to prevent memory leaks
  if (notificationListenerRegistered && notificationListener) {
    notifier.removeListener("click", notificationListener);
    notificationListener = null;
    notificationListenerRegistered = false;
  }

  // Get the current network name
  const network = await getWifiName();
  if (!network) {
    return; // Not connected to WiFi or error occurred
  }

  // Check if connected to the company network
  if (network === process.env.COMPANY_NETWORK) {
    // Create a new listener function
    notificationListener = async (notifierObject: unknown, options: unknown, event: string) => {
      if (event === "clicked" || event === "activate") {
        try {
          await clockIn();
        } catch (error) {
          console.error("Failed to clock in from notification:", error);
          // Could show an error notification here
        }
      }
    };

    // Register the listener
    notifier.on("click", notificationListener);
    notificationListenerRegistered = true;

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
  }
};

// Function to check and update the lock file
export const checkAndUpdateLock = async (): Promise<boolean> => {
  // Use user's home directory for lock file to ensure it's writable
  const lockDir = join(os.homedir(), ".xbar-clockify");
  const LOCK_FILE = join(lockDir, ".notify_lock");
  const LOCK_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

  try {
    // Ensure the lock directory exists
    await fs.mkdir(lockDir, { recursive: true });

    // Get the stats of the lock file
    const stats = await fs.stat(LOCK_FILE);
    const now = new Date();

    // Check if the lock duration has passed
    if (now.getTime() - stats.mtime.getTime() > LOCK_DURATION) {
      // If so, update the lock file
      await fs.writeFile(LOCK_FILE, "");
      return true; // Indicate that the lock was updated
    }
    return false;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      // If the lock file doesn't exist, create it
      try {
        await fs.writeFile(LOCK_FILE, "");
        return true; // Indicate that a new lock was created
      } catch (writeError) {
        console.error("Failed to create lock file:", writeError);
        return false;
      }
    }
    console.error("Error checking lock file:", error);
    return false; // Indicate that the lock check failed
  }
};
