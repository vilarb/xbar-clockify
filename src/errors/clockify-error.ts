// Custom error classes for Clockify API

export class ClockifyAPIError extends Error {
  constructor(message: string, public statusCode?: number, public response?: unknown) {
    super(message);
    this.name = "ClockifyAPIError";
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ClockifyAPIError);
    }
  }
}

export class ClockifyNetworkError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = "ClockifyNetworkError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ClockifyNetworkError);
    }
  }
}
