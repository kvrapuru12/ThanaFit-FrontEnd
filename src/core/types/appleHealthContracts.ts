/** MVP contracts: POST /integrations/apple-health/ingest + GET /dashboard/daily */

export type AppleHealthMetric = 'STEPS';

export interface AppleHealthIngestSample {
  metric: AppleHealthMetric;
  externalSampleId: string;
  /** User-local day identifier in YYYY-MM-DD for aggregation. */
  localDate: string;
  /** ISO-8601 in UTC, e.g. 2026-04-15T07:00:00Z */
  start: string;
  end: string;
  value: number;
}

export interface AppleHealthIngestRequest {
  clientIngestSchemaVersion: number;
  anchorTimeZone: string;
  samples: AppleHealthIngestSample[];
}

export type AppleHealthIngestResultStatus = 'UPSERTED' | 'UNCHANGED' | 'REJECTED';

export interface AppleHealthIngestResultItem {
  externalSampleId: string;
  status: AppleHealthIngestResultStatus;
  message: string | null;
}

export interface AppleHealthIngestResponse {
  accepted: number;
  unchanged: number;
  rejected: number;
  affectedLocalDates: string[];
  results: AppleHealthIngestResultItem[];
  serverIngestSchemaVersion: number;
}

export interface DashboardDailyStepsBySource {
  source: string;
  steps: number;
}

export interface DashboardDailyConflictFlags {
  manualVsAppleMismatch: boolean;
  manualIgnoredForDisplay: boolean;
}

export interface DashboardDailySteps {
  mergePolicy: string;
  displayedSteps: number;
  bySource: DashboardDailyStepsBySource[];
  conflictFlags: DashboardDailyConflictFlags;
}

export interface DashboardDailyResponse {
  localDate: string;
  timeZone: string;
  schemaVersion: number;
  generatedAt: string;
  steps: DashboardDailySteps;
}
