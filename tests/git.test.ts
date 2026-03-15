import { describe, it, expect } from 'vitest';
import { hashCwd, isCacheValid, CACHE_TTL } from '../src/git';

describe('hashCwd', () => {
  it('produces a short hex string', () => {
    const h = hashCwd('/some/path');
    expect(h).toMatch(/^[0-9a-f]{8}$/);
  });

  it('produces different hashes for different paths', () => {
    expect(hashCwd('/path/a')).not.toBe(hashCwd('/path/b'));
  });

  it('produces same hash for same path', () => {
    expect(hashCwd('/path/a')).toBe(hashCwd('/path/a'));
  });
});

describe('isCacheValid', () => {
  it('returns false when ts is 0', () => {
    expect(isCacheValid(0, Date.now())).toBe(false);
  });

  it('returns true within TTL', () => {
    const now = Date.now();
    expect(isCacheValid(now - 1000, now)).toBe(true);
  });

  it('returns false after TTL expires', () => {
    const now = Date.now();
    expect(isCacheValid(now - CACHE_TTL - 1, now)).toBe(false);
  });
});
