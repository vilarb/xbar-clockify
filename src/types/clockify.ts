// Clockify API Type Definitions

export interface TimeInterval {
  start: string;
  end: string | null;
  duration?: string;
}

export interface TimeEntry {
  id: string;
  description?: string;
  userId: string;
  billable: boolean;
  projectId?: string;
  timeInterval: TimeInterval;
  workspaceId: string;
  isLocked: boolean;
  tags?: Array<{ id: string; name: string }>;
  customFields?: Array<{ customFieldId: string; value: string }>;
}

export interface ClockifyErrorResponse {
  message?: string;
  code?: number;
  errors?: Record<string, string[]>;
}
