// In-memory & SessionStorage Fast Fetch Cache for instantaneous page loads

const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 120 * 1000; // 2 minutes

export async function fastFetchJson<T = any>(url: string, forceFresh = false): Promise<T> {
  const now = Date.now();

  // 1. Check in-memory JS cache
  if (!forceFresh && memoryCache.has(url)) {
    const cached = memoryCache.get(url)!;
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }
  }

  // 2. Check SessionStorage cache (for page refresh resilience)
  if (!forceFresh && typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = sessionStorage.getItem(`fast_cache:${url}`);
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (now - timestamp < CACHE_TTL_MS) {
          memoryCache.set(url, { data, timestamp });
          return data as T;
        }
      }
    } catch (e) {}
  }

  // 3. Network Fetch
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const data = await res.json();

  // 4. Update memory & sessionStorage
  memoryCache.set(url, { data, timestamp: now });
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      sessionStorage.setItem(`fast_cache:${url}`, JSON.stringify({ data, timestamp: now }));
    } catch (e) {}
  }

  return data as T;
}
