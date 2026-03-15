import { execFileSync } from 'child_process';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { GitInfo } from './types';

export const CACHE_TTL = 5_000; // 5 seconds

export function hashCwd(cwd: string): string {
  return createHash('md5').update(cwd).digest('hex').slice(0, 8);
}

export function isCacheValid(cacheTs: number, now: number): boolean {
  if (cacheTs === 0) return false;
  return (now - cacheTs) < CACHE_TTL;
}

function cachePath(cwd: string): string {
  return path.join(os.tmpdir(), `claude-statusline-git-${hashCwd(cwd)}.json`);
}

function execGit(args: string[], cwd: string): string {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function fetchGitInfo(cwd: string): GitInfo | null {
  const gitDir = execGit(['rev-parse', '--git-dir'], cwd);
  if (!gitDir) return null;

  const branch = execGit(['branch', '--show-current'], cwd) || 'HEAD';
  const statusOutput = execGit(['status', '--short'], cwd);
  const files = statusOutput ? statusOutput.split('\n').filter(Boolean).length : 0;
  const dirty = files > 0;

  let ahead = 0;
  let behind = 0;
  const counts = execGit(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}'], cwd);
  if (counts) {
    const parts = counts.split(/\s+/);
    ahead = parseInt(parts[0], 10) || 0;
    behind = parseInt(parts[1], 10) || 0;
  }

  return { branch, files, dirty, ahead, behind };
}

export function getGitInfo(cwd: string): GitInfo | null {
  const file = cachePath(cwd);
  const now = Date.now();

  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const cached = JSON.parse(raw);
    if (isCacheValid(cached.ts, now)) {
      return cached.data;
    }
  } catch {
    // No cache or invalid — fetch fresh
  }

  const info = fetchGitInfo(cwd);

  try {
    fs.writeFileSync(file, JSON.stringify({ ts: now, data: info }));
  } catch {
    // Ignore write failures
  }

  return info;
}
