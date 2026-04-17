import { apiClient } from '../api/ApiClient';
import type {
  AppleHealthIngestRequest,
  AppleHealthIngestResponse,
  DashboardDailyResponse,
} from '../../core/types/appleHealthContracts';

export async function ingestAppleHealthSamples(
  body: AppleHealthIngestRequest
): Promise<AppleHealthIngestResponse> {
  const response = await apiClient.post<AppleHealthIngestResponse>(
    '/integrations/apple-health/ingest',
    body
  );
  return response.data;
}

export async function getDashboardDaily(
  localDate: string,
  timeZone: string
): Promise<DashboardDailyResponse> {
  const params = new URLSearchParams({
    localDate,
    timeZone,
  });
  const response = await apiClient.get<DashboardDailyResponse>(
    `/dashboard/daily?${params.toString()}`
  );
  return response.data;
}
