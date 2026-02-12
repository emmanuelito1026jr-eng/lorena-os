const REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours
const LAST_REFRESH_KEY = 'mlsLastRefresh';

export function needsRefresh(): boolean {
  const lastRefresh = localStorage.getItem(LAST_REFRESH_KEY);
  if (!lastRefresh) return true;

  const lastRefreshTime = new Date(lastRefresh).getTime();
  return Date.now() - lastRefreshTime > REFRESH_INTERVAL_MS;
}

export function markRefreshed(): void {
  localStorage.setItem(LAST_REFRESH_KEY, new Date().toISOString());
}

export function getLastRefreshTime(): Date | null {
  const lastRefresh = localStorage.getItem(LAST_REFRESH_KEY);
  return lastRefresh ? new Date(lastRefresh) : null;
}

export function formatLastRefresh(): string {
  const lastRefresh = getLastRefreshTime();
  if (!lastRefresh) return 'Data last updated: Just now';

  return `Data last updated: ${lastRefresh.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}
