import type { TimeEntry, ClockifyErrorResponse } from "../types/clockify.js";
import { ClockifyAPIError, ClockifyNetworkError } from "../errors/clockify-error.js";

// Helper function to create headers
const createHeaders = (): Headers => {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("X-Api-Key", process.env.API_TOKEN!);
  return headers;
};

// Helper function to build API URL
const buildUrl = (endpoint: string): string => {
  const baseUrl = process.env.BASE_URL!;
  const workspaceId = process.env.WORKSPACE_ID!;
  const userId = process.env.MY_USER_ID!;
  return `${baseUrl}/v1/workspaces/${workspaceId}/user/${userId}${endpoint}`;
};

// Helper function to handle API responses and errors
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorData: ClockifyErrorResponse = {};
    try {
      errorData = (await response.json()) as ClockifyErrorResponse;
    } catch {
      // If JSON parsing fails, use empty object
    }

    const errorMessage = errorData.message || response.statusText || "API request failed";
    throw new ClockifyAPIError(errorMessage, response.status, errorData);
  }

  try {
    const data = (await response.json()) as T;
    return data;
  } catch (error) {
    throw new ClockifyAPIError("Failed to parse API response", response.status, error);
  }
};

export const clockIn = async (): Promise<TimeEntry> => {
  try {
    const headers = createHeaders();
    const raw = JSON.stringify({
      start: new Date().toISOString(),
      projectId: process.env.PROJECT_ID,
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers,
      body: raw,
      redirect: "follow",
    };

    const response = await fetch(buildUrl("/time-entries"), requestOptions);

    return handleResponse<TimeEntry>(response);
  } catch (error) {
    if (error instanceof ClockifyAPIError) {
      throw error;
    }
    throw new ClockifyNetworkError(`Network error while clocking in: ${error instanceof Error ? error.message : "Unknown error"}`, error);
  }
};

export const clockOut = async (): Promise<TimeEntry> => {
  try {
    // First, get the active time entry
    const timeEntries = await getTimeEntries();
    const activeEntry = timeEntries.find((entry) => !entry.timeInterval.end);

    if (!activeEntry) {
      throw new ClockifyAPIError("No active time entry found to clock out", 404);
    }

    const headers = createHeaders();
    const raw = JSON.stringify({
      end: new Date().toISOString(),
    });

    const requestOptions: RequestInit = {
      method: "PATCH",
      headers,
      body: raw,
      redirect: "follow",
    };

    // Use the active entry's ID to close it
    const response = await fetch(`${process.env.BASE_URL}/v1/workspaces/${process.env.WORKSPACE_ID}/time-entries/${activeEntry.id}`, requestOptions);

    return handleResponse<TimeEntry>(response);
  } catch (error) {
    if (error instanceof ClockifyAPIError) {
      throw error;
    }
    throw new ClockifyNetworkError(`Network error while clocking out: ${error instanceof Error ? error.message : "Unknown error"}`, error);
  }
};

export const getTimeEntries = async (): Promise<TimeEntry[]> => {
  try {
    const headers = createHeaders();
    const requestOptions: RequestInit = {
      method: "GET",
      headers,
      redirect: "follow",
    };

    const response = await fetch(buildUrl("/time-entries"), requestOptions);

    return handleResponse<TimeEntry[]>(response);
  } catch (error) {
    if (error instanceof ClockifyAPIError) {
      throw error;
    }
    throw new ClockifyNetworkError(`Network error while fetching time entries: ${error instanceof Error ? error.message : "Unknown error"}`, error);
  }
};
