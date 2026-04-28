import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cycle, CycleSyncSuggestionsResponse } from '../services/cycleApi';

const CACHE_SCHEMA_VERSION = 1;
const CACHE_NAMESPACE = 'cycleSync';
const SUGGESTIONS_KEY = `${CACHE_NAMESPACE}:suggestions`;
const RECENT_CYCLE_KEY = `${CACHE_NAMESPACE}:recentCycle`;

export const CYCLE_SYNC_SUGGESTIONS_TTL_MS = 8 * 60 * 60 * 1000; // 8h
export const CYCLE_SYNC_RECENT_CYCLE_TTL_MS = 15 * 60 * 1000; // 15m

interface CacheEnvelope<T> {
  userId: number;
  savedAt: number;
  schemaVersion: number;
  data: T;
}

export interface CachedDataResult<T> {
  data: T | null;
  isStale: boolean;
}

const inFlightRequests = new Map<string, Promise<unknown>>();

function buildUserKey(baseKey: string, userId: number): string {
  return `${baseKey}:${userId}`;
}

function isExpired(savedAt: number, ttlMs: number): boolean {
  return Date.now() - savedAt > ttlMs;
}

async function readCachedData<T>(
  storageKey: string,
  userId: number,
  ttlMs: number
): Promise<CachedDataResult<T>> {
  try {
    const raw = await AsyncStorage.getItem(buildUserKey(storageKey, userId));
    if (!raw) {
      return { data: null, isStale: true };
    }

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (
      !parsed ||
      parsed.userId !== userId ||
      parsed.schemaVersion !== CACHE_SCHEMA_VERSION ||
      parsed.savedAt <= 0
    ) {
      return { data: null, isStale: true };
    }

    return { data: parsed.data, isStale: isExpired(parsed.savedAt, ttlMs) };
  } catch (error) {
    console.warn('CycleSync cache read failed:', error);
    return { data: null, isStale: true };
  }
}

async function writeCachedData<T>(storageKey: string, userId: number, data: T): Promise<void> {
  const envelope: CacheEnvelope<T> = {
    userId,
    savedAt: Date.now(),
    schemaVersion: CACHE_SCHEMA_VERSION,
    data,
  };

  try {
    await AsyncStorage.setItem(buildUserKey(storageKey, userId), JSON.stringify(envelope));
  } catch (error) {
    console.warn('CycleSync cache write failed:', error);
  }
}

export async function readSuggestionsCache(userId: number): Promise<CachedDataResult<CycleSyncSuggestionsResponse>> {
  return readCachedData<CycleSyncSuggestionsResponse>(
    SUGGESTIONS_KEY,
    userId,
    CYCLE_SYNC_SUGGESTIONS_TTL_MS
  );
}

export async function writeSuggestionsCache(userId: number, data: CycleSyncSuggestionsResponse): Promise<void> {
  await writeCachedData(SUGGESTIONS_KEY, userId, data);
}

export async function readRecentCycleCache(userId: number): Promise<CachedDataResult<Cycle | null>> {
  return readCachedData<Cycle | null>(RECENT_CYCLE_KEY, userId, CYCLE_SYNC_RECENT_CYCLE_TTL_MS);
}

export async function writeRecentCycleCache(userId: number, data: Cycle | null): Promise<void> {
  await writeCachedData(RECENT_CYCLE_KEY, userId, data);
}

export async function invalidateRecentCycleCache(userId: number): Promise<void> {
  try {
    await AsyncStorage.removeItem(buildUserKey(RECENT_CYCLE_KEY, userId));
  } catch (error) {
    console.warn('CycleSync recent-cycle cache invalidate failed:', error);
  }
}

export async function invalidateSuggestionsCache(userId: number): Promise<void> {
  try {
    await AsyncStorage.removeItem(buildUserKey(SUGGESTIONS_KEY, userId));
  } catch (error) {
    console.warn('CycleSync suggestions cache invalidate failed:', error);
  }
}

export async function invalidateCycleSyncCache(userId: number): Promise<void> {
  await Promise.all([invalidateRecentCycleCache(userId), invalidateSuggestionsCache(userId)]);
}

export async function dedupeInFlight<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const inFlight = inFlightRequests.get(key);
  if (inFlight) {
    return inFlight as Promise<T>;
  }

  const request = fetcher()
    .catch((error) => {
      throw error;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, request as Promise<unknown>);
  return request;
}
