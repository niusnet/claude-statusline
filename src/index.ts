import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { c } from './colors';
import type { StatusLineData, ClaudeSettings } from './types';
import {
  model, context, remaining, rate, maxOutput, directory,
  git, duration, lines, cumulative, agent, worktree,
  outputStyle, mcp, thinking, ccVersion,
} from './segments';
import { getGitInfo } from './git';

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 2000);
  });
}

function readSettings(): ClaudeSettings {
  try {
    const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
    return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  } catch {
    return {};
  }
}

function getMcpCount(settings: ClaudeSettings): number {
  return Object.keys(settings.mcpServers || {}).length;
}

async function main() {
  const input = await readStdin();
  if (!input.trim()) {
    console.log('Claude Code');
    process.exit(0);
  }

  let data: StatusLineData;
  try {
    data = JSON.parse(input);
  } catch {
    console.log('Claude Code');
    process.exit(0);
  }

  const termWidth = process.stdout.columns || 120;
  const wide = termWidth >= 120;
  const sep = ` ${c.dim}│${c.reset} `;

  const cwd = data.workspace?.current_dir || data.cwd || process.cwd();
  const gitInfo = getGitInfo(cwd);
  const settings = readSettings();
  const mcpCount = getMcpCount(settings);

  // Line 1 — always visible
  const line1Parts = [
    model(data),
    context(data, wide),
    remaining(data),
    ...(wide ? [rate(data), maxOutput(data)] : []),
    directory(data, termWidth),
    git(gitInfo),
    ...(wide ? [agent(data), worktree(data), mcp(mcpCount), thinking(settings)] : []),
  ].filter(Boolean);

  console.log(line1Parts.join(sep));

  // Line 2 — only on wide terminals
  if (wide) {
    const line2Parts = [
      duration(data),
      lines(data),
      cumulative(data),
      outputStyle(data),
      ccVersion(data),
    ].filter(Boolean);
    console.log(line2Parts.join(sep));
  }
}

main();
