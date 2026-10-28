import { AsyncLocalStorage } from 'async_hooks';

export interface RequestTimingState {
  start: number;
  dbTimeMs: number;
  dbQueries: number;
  poolTimeMs: number;
  transformTimeMs: number;
}

const timingStorage = new AsyncLocalStorage<RequestTimingState>();

export function runWithTimingContext<T>(
  initialState: RequestTimingState,
  fn: () => T,
): T {
  return timingStorage.run(initialState, fn);
}

export function getTimingContext(): RequestTimingState | undefined {
  return timingStorage.getStore();
}

export function recordDbTiming(durationMs: number): void {
  const store = timingStorage.getStore();
  if (store) {
    store.dbTimeMs += durationMs;
    store.dbQueries += 1;
  }
}

export function recordPoolTiming(durationMs: number): void {
  const store = timingStorage.getStore();
  if (store) {
    store.poolTimeMs += durationMs;
  }
}

export function recordTransformTiming(durationMs: number): void {
  const store = timingStorage.getStore();
  if (store) {
    store.transformTimeMs += durationMs;
  }
}
