export function formatTokens(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return Number.isInteger(m) ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const k = Math.round(n / 1_000);
    return k >= 1000 ? '1M' : `${k}k`;
  }
  return String(n);
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const totalMin = Math.floor(totalSec / 60);
  if (totalMin < 60) {
    const secs = totalSec % 60;
    return `${totalMin}m${secs}s`;
  }
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return `${hours}h${mins}m`;
}

export function formatPercent(pct: number | null): string {
  return `${Math.floor(pct ?? 0)}%`;
}

export function formatRate(totalTokens: number, durationMs: number): string | null {
  if (durationMs < 10_000) return null;
  const rate = Math.round(totalTokens * 60_000 / durationMs);
  return `↗ ${formatTokens(rate)}/min`;
}
