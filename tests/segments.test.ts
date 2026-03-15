import { describe, it, expect } from 'vitest';
import {
  model, context, remaining, rate, maxOutput, directory,
  git, duration, lines, cumulative, agent, worktree,
  outputStyle, mcp, thinking, ccVersion,
} from '../src/segments';
import type { StatusLineData, GitInfo, ClaudeSettings } from '../src/types';
import { c } from '../src/colors';

const baseData: StatusLineData = {
  cwd: '/home/user/project',
  session_id: 'abc123',
  transcript_path: '/tmp/transcript.jsonl',
  version: '1.0.85',
  model: { id: 'claude-sonnet-4-6', display_name: 'Sonnet 4.6' },
  workspace: { current_dir: '/home/user/project', project_dir: '/home/user/project' },
  cost: {
    total_cost_usd: 0.03,
    total_duration_ms: 272000,
    total_api_duration_ms: 15000,
    total_lines_added: 156,
    total_lines_removed: 23,
  },
  context_window: {
    total_input_tokens: 120000,
    total_output_tokens: 45000,
    context_window_size: 1000000,
    used_percentage: 12,
    remaining_percentage: 88,
    current_usage: {
      input_tokens: 85000,
      output_tokens: 12000,
      cache_creation_input_tokens: 20000,
      cache_read_input_tokens: 15000,
    },
  },
  exceeds_200k_tokens: false,
};

describe('model', () => {
  it('returns display name with color', () => {
    expect(model(baseData)).toBe(`${c.cyan}Sonnet 4.6${c.reset}`);
  });
});

describe('context', () => {
  it('wide: shows percent with used/total', () => {
    const result = context(baseData, true);
    expect(result).toContain('12%');
    expect(result).toContain('120k');
    expect(result).toContain('1M');
  });

  it('narrow: shows only percent', () => {
    const result = context(baseData, false);
    expect(result).toContain('12%');
    expect(result).not.toContain('120k');
  });

  it('handles null used_percentage', () => {
    const data = { ...baseData, context_window: { ...baseData.context_window, used_percentage: null } };
    const result = context(data, true);
    expect(result).toContain('0%');
  });

  it('uses green color below 70%', () => {
    const data = { ...baseData, context_window: { ...baseData.context_window, used_percentage: 69 } };
    expect(context(data, true)).toContain(c.green);
  });

  it('uses yellow color at 70%', () => {
    const data = { ...baseData, context_window: { ...baseData.context_window, used_percentage: 70 } };
    expect(context(data, true)).toContain(c.yellow);
  });

  it('uses red color at 90%', () => {
    const data = { ...baseData, context_window: { ...baseData.context_window, used_percentage: 90 } };
    expect(context(data, true)).toContain(c.red);
  });
});

describe('remaining', () => {
  it('shows remaining tokens', () => {
    const result = remaining(baseData);
    expect(result).toContain('left');
    expect(result).toContain('880k');
  });
});

describe('rate', () => {
  it('shows rate when duration > 10s', () => {
    const result = rate(baseData);
    expect(result).toContain('↗');
    expect(result).toContain('/min');
  });

  it('returns null when duration < 10s', () => {
    const data = { ...baseData, cost: { ...baseData.cost, total_duration_ms: 5000 } };
    expect(rate(data)).toBeNull();
  });

  it('uses green for rate < 5000/min', () => {
    const data = { ...baseData, context_window: { ...baseData.context_window, total_input_tokens: 1000 }, cost: { ...baseData.cost, total_duration_ms: 60000 } };
    expect(rate(data)).toContain(c.green);
  });

  it('uses yellow for rate 5000-20000/min', () => {
    const data = { ...baseData, context_window: { ...baseData.context_window, total_input_tokens: 10000 }, cost: { ...baseData.cost, total_duration_ms: 60000 } };
    expect(rate(data)).toContain(c.yellow);
  });

  it('uses red for rate > 20000/min', () => {
    const data = { ...baseData, context_window: { ...baseData.context_window, total_input_tokens: 25000 }, cost: { ...baseData.cost, total_duration_ms: 60000 } };
    expect(rate(data)).toContain(c.red);
  });
});

describe('maxOutput', () => {
  it('returns 64k for Sonnet 4.6', () => {
    expect(maxOutput(baseData)).toContain('64k');
  });

  it('returns 128k for Opus 4.6', () => {
    const data = { ...baseData, model: { id: 'claude-opus-4-6', display_name: 'Opus 4.6' } };
    expect(maxOutput(data)).toContain('128k');
  });

  it('returns 64k for Haiku 4.5', () => {
    const data = { ...baseData, model: { id: 'claude-haiku-4-5', display_name: 'Haiku 4.5' } };
    expect(maxOutput(data)).toContain('64k');
  });

  it('returns null for unknown model', () => {
    const data = { ...baseData, model: { id: 'unknown', display_name: 'Unknown' } };
    expect(maxOutput(data)).toBeNull();
  });
});

describe('directory', () => {
  it('shows basename of current_dir', () => {
    const result = directory(baseData, 120);
    expect(result).toContain('project');
  });

  it('truncates long names on narrow terminals', () => {
    const data = { ...baseData, workspace: { ...baseData.workspace, current_dir: '/home/user/nombre-de-directorio-muy-largo-aqui' } };
    const result = directory(data, 100);
    expect(result).toContain('…');
  });

  it('does not truncate short names on narrow terminals', () => {
    const result = directory(baseData, 100);
    expect(result).not.toContain('…');
  });
});

describe('git', () => {
  it('shows branch with files and dirty marker', () => {
    const info: GitInfo = { branch: 'main', files: 5, dirty: true, ahead: 0, behind: 0 };
    const result = git(info);
    expect(result).toContain('main');
    expect(result).toContain('±5');
    expect(result).toContain('*');
  });

  it('shows branch only when clean', () => {
    const info: GitInfo = { branch: 'main', files: 0, dirty: false, ahead: 0, behind: 0 };
    const result = git(info);
    expect(result).toContain('main');
    expect(result).not.toContain('±');
    expect(result).not.toContain('*');
  });

  it('shows ahead/behind arrows', () => {
    const info: GitInfo = { branch: 'main', files: 0, dirty: false, ahead: 2, behind: 1 };
    const result = git(info);
    expect(result).toContain('↑2');
    expect(result).toContain('↓1');
  });

  it('returns null when gitInfo is null', () => {
    expect(git(null)).toBeNull();
  });
});

describe('duration', () => {
  it('formats duration from cost', () => {
    const result = duration(baseData);
    expect(result).toContain('⏱');
    expect(result).toContain('4m32s');
  });
});

describe('lines', () => {
  it('shows added and removed', () => {
    const result = lines(baseData);
    expect(result).toContain('+156');
    expect(result).toContain('-23');
  });

  it('returns null when both are 0', () => {
    const data = { ...baseData, cost: { ...baseData.cost, total_lines_added: 0, total_lines_removed: 0 } };
    expect(lines(data)).toBeNull();
  });

  it('shows both even if one is 0', () => {
    const data = { ...baseData, cost: { ...baseData.cost, total_lines_added: 0, total_lines_removed: 5 } };
    const result = lines(data);
    expect(result).toContain('+0');
    expect(result).toContain('-5');
  });
});

describe('cumulative', () => {
  it('shows input and output totals', () => {
    const result = cumulative(baseData);
    expect(result).toContain('∑');
    expect(result).toContain('120k');
    expect(result).toContain('45k');
  });
});

describe('agent', () => {
  it('returns null when no agent', () => {
    expect(agent(baseData)).toBeNull();
  });

  it('shows agent name when present', () => {
    const data = { ...baseData, agent: { name: 'code-reviewer' } };
    expect(agent(data)).toContain('🤖');
    expect(agent(data)).toContain('code-reviewer');
  });
});

describe('worktree', () => {
  it('returns null when no worktree', () => {
    expect(worktree(baseData)).toBeNull();
  });

  it('shows worktree name when present', () => {
    const data = { ...baseData, worktree: { name: 'my-feature', path: '/tmp/wt', original_cwd: '/home' } };
    expect(worktree(data)).toContain('⎇');
    expect(worktree(data)).toContain('my-feature');
  });
});

describe('outputStyle', () => {
  it('returns null when no style', () => {
    expect(outputStyle(baseData)).toBeNull();
  });

  it('returns null for default style', () => {
    const data = { ...baseData, output_style: { name: 'default' } };
    expect(outputStyle(data)).toBeNull();
  });

  it('shows custom style name', () => {
    const data = { ...baseData, output_style: { name: 'Gilberto' } };
    expect(outputStyle(data)).toContain('Gilberto');
  });
});

describe('mcp', () => {
  it('returns null when count is 0', () => {
    expect(mcp(0)).toBeNull();
  });

  it('shows count when >= 1', () => {
    expect(mcp(3)).toContain('⚡');
    expect(mcp(3)).toContain('3');
  });
});

describe('thinking', () => {
  it('returns null when not enabled', () => {
    expect(thinking({})).toBeNull();
    expect(thinking({ alwaysThinkingEnabled: false })).toBeNull();
  });

  it('shows indicator when enabled', () => {
    expect(thinking({ alwaysThinkingEnabled: true })).toContain('◑');
    expect(thinking({ alwaysThinkingEnabled: true })).toContain('thinking');
  });
});

describe('ccVersion', () => {
  it('shows version', () => {
    expect(ccVersion(baseData)).toContain('cc');
    expect(ccVersion(baseData)).toContain('1.0.85');
  });
});
