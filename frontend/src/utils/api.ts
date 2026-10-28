/**
 * In-flight promise deduplicator for simultaneous read requests.
 * Only merges concurrent, simultaneous requests in flight.
 * Clears immediately upon resolution so subsequent calls always fetch fresh data.
 *
 * Safety guarantees:
 * 1. Deduplication key incorporates all response-affecting options (headers,
 *    credentials, cache, mode, redirect, integrity, etc.) in a deterministic order
 *    so incompatible requests never share the same in-flight Promise.
 * 2. Each caller's AbortSignal is isolated: aborting Caller A will NOT cancel
 *    the in-flight fetch for Caller B.
 * 3. In-flight entry is always removed in finally, whether fetch succeeds or fails.
 * 4. Only pure GET requests are deduplicated; non-GET requests bypass the map.
 */
const inFlightRequests = new Map<string, Promise<unknown>>();

function normalizeHeaders(headers?: HeadersInit): [string, string][] {
  if (!headers) return [];

  const entries: [string, string][] = [];

  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    headers.forEach((value, key) => {
      entries.push([key.toLowerCase(), value]);
    });
  } else if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      if (typeof key === 'string' && typeof value === 'string') {
        entries.push([key.toLowerCase(), value]);
      }
    }
  } else if (headers && typeof headers === 'object') {
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string') {
        entries.push([key.toLowerCase(), value]);
      }
    }
  }

  entries.sort(([a], [b]) => a.localeCompare(b));
  return entries;
}

function getDeduplicationKey(url: string, init?: RequestInit): string {
  if (!init) return url;

  // Signal and method are explicitly excluded: method is always GET here,
  // and caller signal cancellation is handled in the per-caller wrapper promise.
  const rest: Record<string, unknown> = { ...init };
  delete rest.signal;
  delete rest.method;
  const headers = rest.headers as HeadersInit | undefined;
  delete rest.headers;

  const normalizedHeaders = normalizeHeaders(headers);
  const sortedRestEntries = Object.entries(rest)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));

  const hasHeaders = normalizedHeaders.length > 0;
  const hasRest = sortedRestEntries.length > 0;

  if (!hasHeaders && !hasRest) {
    return url;
  }

  return JSON.stringify([
    url,
    hasHeaders ? normalizedHeaders : null,
    hasRest ? sortedRestEntries : null,
  ]);
}

export async function fetchJsonDeduplicated<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 15000,
): Promise<T> {
  const method = (init?.method || 'GET').toUpperCase();

  // Non-GET requests should never be deduplicated
  if (method !== 'GET') {
    const res = await fetchWithTimeout(url, init, timeoutMs);
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      (err as unknown as { status: number }).status = res.status;
      throw err;
    }
    return (await res.json()) as T;
  }

  const signal = init?.signal;
  if (signal?.aborted) {
    return Promise.reject(
      new DOMException('The user aborted a request.', 'AbortError'),
    );
  }

  const deduplicationKey = getDeduplicationKey(url, init);

  let sharedPromise = inFlightRequests.get(deduplicationKey);
  if (!sharedPromise) {
    sharedPromise = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        // Shared fetch runs with its own internal timeout signal, independent of individual
        // caller signals, so that one caller's unmount/abort does not terminate the in-flight
        // network fetch for other listeners or corrupt shared in-flight state.
        const restInit: RequestInit = { ...init };
        delete restInit.signal;
        const res = await fetch(url, {
          ...restInit,
          signal: controller.signal,
        });
        if (!res.ok) {
          const err = new Error(`HTTP ${res.status}`);
          (err as unknown as { status: number }).status = res.status;
          throw err;
        }
        return (await res.json()) as T;
      } finally {
        clearTimeout(timer);
        inFlightRequests.delete(deduplicationKey);
      }
    })();

    inFlightRequests.set(deduplicationKey, sharedPromise);
  }

  // If this specific caller did not provide an AbortSignal, return the shared promise directly.
  if (!signal) {
    return sharedPromise as Promise<T>;
  }

  // If this caller provided an AbortSignal, isolate its cancellation.
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort);
      reject(new DOMException('The user aborted a request.', 'AbortError'));
    };

    signal.addEventListener('abort', onAbort, { once: true });

    (sharedPromise as Promise<T>).then(
      (val) => {
        signal.removeEventListener('abort', onAbort);
        resolve(val);
      },
      (err) => {
        signal.removeEventListener('abort', onAbort);
        reject(err);
      },
    );
  });
}

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Fallback for Vercel production deployment if env var is missing or misconfigured
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://rentnest-syps.onrender.com';
  }

  return 'http://localhost:3000';
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 15000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const callerSignal = init?.signal;
  if (callerSignal) {
    if (callerSignal.aborted) {
      clearTimeout(timer);
      controller.abort();
    } else {
      callerSignal.addEventListener('abort', () => {
        clearTimeout(timer);
        controller.abort();
      }, { once: true });
    }
  }

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCategoriesDeduplicated(
  apiUrl: string,
): Promise<unknown> {
  return fetchJsonDeduplicated(`${apiUrl}/categories`);
}
