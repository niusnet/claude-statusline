export interface StatusLineData {
  cwd: string;
  session_id: string;
  transcript_path: string;
  version: string;
  model: {
    id: string;
    display_name: string;
  };
  workspace: {
    current_dir: string;
    project_dir: string;
  };
  output_style?: {
    name: string;
  };
  cost: {
    total_cost_usd: number;
    total_duration_ms: number;
    total_api_duration_ms: number;
    total_lines_added: number;
    total_lines_removed: number;
  };
  context_window: {
    total_input_tokens: number;
    total_output_tokens: number;
    context_window_size: number;
    used_percentage: number | null;
    remaining_percentage: number | null;
    current_usage: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens: number;
      cache_read_input_tokens: number;
    } | null;
  };
  exceeds_200k_tokens: boolean;
  vim?: { mode: string };
  agent?: { name: string };
  worktree?: {
    name: string;
    path: string;
    branch?: string;
    original_cwd: string;
    original_branch?: string;
  };
}

export interface GitInfo {
  branch: string;
  files: number;
  dirty: boolean;
  ahead: number;
  behind: number;
}

export interface ClaudeSettings {
  mcpServers?: Record<string, unknown>;
  alwaysThinkingEnabled?: boolean;
}
