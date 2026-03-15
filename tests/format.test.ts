import { describe, it, expect } from 'vitest';
import { formatTokens, formatDuration, formatPercent, formatRate } from '../src/format';

describe('formatTokens', () => {
  it('returns raw number below 1000', () => {
    expect(formatTokens(0)).toBe('0');
    expect(formatTokens(500)).toBe('500');
    expect(formatTokens(999)).toBe('999');
  });

  it('formats thousands as k', () => {
    expect(formatTokens(1000)).toBe('1k');
    expect(formatTokens(1500)).toBe('2k');
    expect(formatTokens(45000)).toBe('45k');
    expect(formatTokens(999499)).toBe('999k');
  });

  it('handles 999500-999999 rounding to 1M (not 1000k)', () => {
    expect(formatTokens(999500)).toBe('1M');
    expect(formatTokens(999999)).toBe('1M');
  });

  it('formats millions', () => {
    expect(formatTokens(1000000)).toBe('1M');
    expect(formatTokens(1400000)).toBe('1.4M');
    expect(formatTokens(2000000)).toBe('2M');
    expect(formatTokens(10500000)).toBe('10.5M');
  });
});

describe('formatDuration', () => {
  it('formats zero', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('formats seconds only', () => {
    expect(formatDuration(45000)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(272000)).toBe('4m32s');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(3600000)).toBe('1h0m');
    expect(formatDuration(5432000)).toBe('1h30m');
  });
});

describe('formatPercent', () => {
  it('formats number to integer percent', () => {
    expect(formatPercent(12.7)).toBe('12%');
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(99.9)).toBe('99%');
  });

  it('handles null as 0%', () => {
    expect(formatPercent(null)).toBe('0%');
  });
});

describe('formatRate', () => {
  it('returns null when duration < 10s', () => {
    expect(formatRate(5000, 9999)).toBeNull();
    expect(formatRate(5000, 0)).toBeNull();
  });

  it('calculates session-average tokens per minute', () => {
    expect(formatRate(15000, 60000)).toBe('↗ 15k/min');
  });

  it('calculates rate for longer sessions', () => {
    expect(formatRate(300000, 300000)).toBe('↗ 60k/min');
  });

  it('handles small rates', () => {
    expect(formatRate(100, 60000)).toBe('↗ 100/min');
  });
});
