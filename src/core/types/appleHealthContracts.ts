/** MVP contracts: POST /integrations/apple-health/ingest + GET /dashboard/daily */

/** SLEEP: value is total asleep hours (decimal) for `localDate` from HealthKit sleep analysis. */
export type AppleHealthMetric = 'STEPS' | 'SLEEP';
export type AppleHealthSleepStage =
  | 'AWAKE'
  | 'IN_BED'
  | 'ASLEEP'
  | 'ASLEEP_UNSPECIFIED'
  | 'CORE'
  | 'DEEP'
  | 'REM';

export interface AppleHealthIngestSample {
  metric: AppleHealthMetric;
  /** Required for SLEEP metric when backend validates staged sleep. */
  sleepStage?: AppleHealthSleepStage;
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
  source: DashboardDailyResolvedSource;
  steps: number;
}

export interface DashboardDailyConflictFlags {
  manualVsAppleMismatch: boolean;
  manualIgnoredForDisplay: boolean;
}

export interface DashboardDailySteps {
  mergePolicy: string;
  displayedSteps: number;
  resolvedSource: DashboardDailyResolvedSource;
  bySource: DashboardDailyStepsBySource[];
  conflictFlags: DashboardDailyConflictFlags;
}

export interface DashboardDailySleepBySource {
  source: DashboardDailyResolvedSource;
  hours: number;
}

export interface DashboardDailySleep {
  mergePolicy: string;
  displayedSleepHours: number;
  resolvedSource: DashboardDailyResolvedSource;
  bySource: DashboardDailySleepBySource[];
  conflictFlags: DashboardDailyConflictFlags;
}

export type DashboardDailyResolvedSource =
  | 'BOTH'
  | 'APPLE_HEALTH'
  | 'MANUAL_APP'
  | 'NONE';

export interface DashboardDailyResponse {
  localDate: string;
  timeZone: string;
  schemaVersion: number;
  generatedAt: string;
  steps: DashboardDailySteps;
  sleep?: DashboardDailySleep;
}
