import { c } from './colors';
import { formatTokens, formatDuration, formatPercent, formatRate } from './format';
import type { StatusLineData, GitInfo, ClaudeSettings } from './types';

export function model(data: StatusLineData): string {
  return `${c.cyan}${data.model.display_name}${c.reset}`;
}

export function context(data: StatusLineData, wide: boolean): string {
  const pct = Math.floor(data.context_window.used_percentage ?? 0);
  const color = pct >= 90 ? c.red : pct >= 70 ? c.yellow : c.green;

  if (!wide) {
    return `${color}✍️ ${pct}%${c.reset}`;
  }

  const cw = data.context_window;
  const used = cw.current_usage
    ? cw.current_usage.input_tokens + cw.current_usage.cache_creation_input_tokens + cw.current_usage.cache_read_input_tokens
    : cw.total_input_tokens;

  return `${color}✍️ ${pct}% (${formatTokens(used)}/${formatTokens(cw.context_window_size)})${c.reset}`;
}

export function remaining(data: StatusLineData): string {
  const cw = data.context_window;
  const used = cw.current_usage
    ? cw.current_usage.input_tokens + cw.current_usage.cache_creation_input_tokens + cw.current_usage.cache_read_input_tokens
    : cw.total_input_tokens;
  const rem = Math.max(0, cw.context_window_size - used);
  return `left ${formatTokens(rem)}`;
}

export function rate(data: StatusLineData): string | null {
  const result = formatRate(data.context_window.total_input_tokens, data.cost.total_duration_ms);
  if (!result) return null;

  const rateVal = Math.round(data.context_window.total_input_tokens * 60_000 / data.cost.total_duration_ms);
  const color = rateVal > 20_000 ? c.red : rateVal >= 5_000 ? c.yellow : c.green;
  return `${color}${result}${c.reset}`;
}

export function maxOutput(data: StatusLineData): string | null {
  const name = data.model.display_name;
  let max = 0;
  if (name.includes('Sonnet') && name.includes('4.6')) max = 64_000;
  else if (name.includes('Opus') && name.includes('4.6')) max = 128_000;
  else if (name.includes('Haiku') && name.includes('4.5')) max = 64_000;

  return max > 0 ? `${c.gray}⬆${formatTokens(max)}${c.reset}` : null;
}

export function directory(data: StatusLineData, termWidth: number): string {
  const fullName = data.workspace.current_dir.replace(/\\/g, '/').split('/').pop() || 'unknown';
  let name = fullName;
  if (termWidth < 120 && fullName.length > 30) {
    name = '…' + fullName.slice(-29);
  }
  return `${c.blue}📁 ${name}${c.reset}`;
}

export function git(info: GitInfo | null): string | null {
  if (!info) return null;

  let result = `${c.green}${info.branch}`;
  if (info.files > 0) result += ` ±${info.files}`;
  if (info.dirty) result += '*';
  if (info.ahead > 0) result += ` ↑${info.ahead}`;
  if (info.behind > 0) result += ` ↓${info.behind}`;
  result += c.reset;

  return result;
}

export function duration(data: StatusLineData): string {
  return `${c.gray}⏱ ${formatDuration(data.cost.total_duration_ms)}${c.reset}`;
}

export function lines(data: StatusLineData): string | null {
  const added = data.cost.total_lines_added;
  const removed = data.cost.total_lines_removed;
  if (added + removed === 0) return null;
  return `${c.green}+${added}${c.reset} ${c.red}-${removed}${c.reset}`;
}

export function cumulative(data: StatusLineData): string {
  const input = formatTokens(data.context_window.total_input_tokens);
  const output = formatTokens(data.context_window.total_output_tokens);
  return `${c.gray}∑ ${input} in ${output} out${c.reset}`;
}

export function agent(data: StatusLineData): string | null {
  if (!data.agent?.name) return null;
  return `${c.magenta}🤖 ${data.agent.name}${c.reset}`;
}

export function worktree(data: StatusLineData): string | null {
  if (!data.worktree?.name) return null;
  return `${c.blue}⎇ ${data.worktree.name}${c.reset}`;
}

export function outputStyle(data: StatusLineData): string | null {
  const name = data.output_style?.name;
  if (!name || name === 'default') return null;
  return `${c.gray}${name}${c.reset}`;
}

export function mcp(count: number): string | null {
  if (count < 1) return null;
  return `${c.yellow}⚡ ${count} mcp${c.reset}`;
}

export function thinking(settings: ClaudeSettings): string | null {
  if (!settings.alwaysThinkingEnabled) return null;
  return `${c.gray}◑ thinking${c.reset}`;
}

export function ccVersion(data: StatusLineData): string {
  return `${c.dim}cc ${data.version}${c.reset}`;
}
