import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import * as path from 'path';

const distPath = path.resolve(process.cwd(), 'dist', 'statusline.js');

function runStatusline(jsonInput: string): string {
  try {
    return execFileSync('node', [distPath], {
      input: jsonInput,
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();
  } catch (e: any) {
    return e.stdout?.trim() || '';
  }
}

const mockJson = JSON.stringify({
  cwd: '/home/user/project',
  session_id: 'test',
  transcript_path: '/tmp/t.jsonl',
  version: '1.0.85',
  model: { id: 'claude-sonnet-4-6', display_name: 'Sonnet 4.6' },
  workspace: { current_dir: '/home/user/project', project_dir: '/home/user/project' },
  cost: { total_cost_usd: 0.03, total_duration_ms: 272000, total_api_duration_ms: 15000, total_lines_added: 156, total_lines_removed: 23 },
  context_window: {
    total_input_tokens: 120000, total_output_tokens: 45000,
    context_window_size: 1000000, used_percentage: 12, remaining_percentage: 88,
    current_usage: { input_tokens: 85000, output_tokens: 12000, cache_creation_input_tokens: 20000, cache_read_input_tokens: 15000 },
  },
  exceeds_200k_tokens: false,
});

describe('integration', () => {
  it('outputs status line with expected segments', () => {
    const output = runStatusline(mockJson);
    expect(output).toContain('Sonnet 4.6');
    expect(output).toContain('12%');
    expect(output).toContain('project');
    expect(output).toContain('1.0.85');
  });

  it('handles empty input gracefully', () => {
    const output = runStatusline('');
    expect(output).toBe('Claude Code');
  });

  it('handles invalid JSON gracefully', () => {
    const output = runStatusline('not json');
    expect(output).toBe('Claude Code');
  });
});
