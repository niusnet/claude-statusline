"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var fs2 = __toESM(require("fs"));
var path2 = __toESM(require("path"));
var os2 = __toESM(require("os"));

// src/colors.ts
var c = {
  reset: "\x1B[0m",
  bold: "\x1B[1m",
  dim: "\x1B[2m",
  red: "\x1B[31m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  blue: "\x1B[34m",
  magenta: "\x1B[35m",
  cyan: "\x1B[36m",
  gray: "\x1B[90m"
};

// src/format.ts
function formatTokens(n) {
  if (n >= 1e6) {
    const m = n / 1e6;
    return Number.isInteger(m) ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (n >= 1e3) {
    const k = Math.round(n / 1e3);
    return k >= 1e3 ? "1M" : `${k}k`;
  }
  return String(n);
}
function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1e3);
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
function formatRate(totalTokens, durationMs) {
  if (durationMs < 1e4) return null;
  const rate2 = Math.round(totalTokens * 6e4 / durationMs);
  return `\u2197 ${formatTokens(rate2)}/min`;
}

// src/segments.ts
function model(data) {
  return `${c.cyan}${data.model.display_name}${c.reset}`;
}
function context(data, wide) {
  const pct = Math.floor(data.context_window.used_percentage ?? 0);
  const color = pct >= 90 ? c.red : pct >= 70 ? c.yellow : c.green;
  if (!wide) {
    return `${color}\u270D\uFE0F ${pct}%${c.reset}`;
  }
  const cw = data.context_window;
  const used = cw.current_usage ? cw.current_usage.input_tokens + cw.current_usage.cache_creation_input_tokens + cw.current_usage.cache_read_input_tokens : cw.total_input_tokens;
  return `${color}\u270D\uFE0F ${pct}% (${formatTokens(used)}/${formatTokens(cw.context_window_size)})${c.reset}`;
}
function remaining(data) {
  const cw = data.context_window;
  const used = cw.current_usage ? cw.current_usage.input_tokens + cw.current_usage.cache_creation_input_tokens + cw.current_usage.cache_read_input_tokens : cw.total_input_tokens;
  const rem = Math.max(0, cw.context_window_size - used);
  return `left ${formatTokens(rem)}`;
}
function rate(data) {
  const result = formatRate(data.context_window.total_input_tokens, data.cost.total_duration_ms);
  if (!result) return null;
  const rateVal = Math.round(data.context_window.total_input_tokens * 6e4 / data.cost.total_duration_ms);
  const color = rateVal > 2e4 ? c.red : rateVal >= 5e3 ? c.yellow : c.green;
  return `${color}${result}${c.reset}`;
}
function maxOutput(data) {
  const name = data.model.display_name;
  let max = 0;
  if (name.includes("Sonnet") && name.includes("4.6")) max = 64e3;
  else if (name.includes("Opus") && name.includes("4.6")) max = 128e3;
  else if (name.includes("Haiku") && name.includes("4.5")) max = 64e3;
  return max > 0 ? `${c.gray}\u2B06${formatTokens(max)}${c.reset}` : null;
}
function directory(data, termWidth) {
  const fullName = data.workspace.current_dir.replace(/\\/g, "/").split("/").pop() || "unknown";
  let name = fullName;
  if (termWidth < 120 && fullName.length > 30) {
    name = "\u2026" + fullName.slice(-29);
  }
  return `${c.blue}\u{1F4C1} ${name}${c.reset}`;
}
function git(info) {
  if (!info) return null;
  let result = `${c.green}${info.branch}`;
  if (info.files > 0) result += ` \xB1${info.files}`;
  if (info.dirty) result += "*";
  if (info.ahead > 0) result += ` \u2191${info.ahead}`;
  if (info.behind > 0) result += ` \u2193${info.behind}`;
  result += c.reset;
  return result;
}
function duration(data) {
  return `${c.gray}\u23F1 ${formatDuration(data.cost.total_duration_ms)}${c.reset}`;
}
function lines(data) {
  const added = data.cost.total_lines_added;
  const removed = data.cost.total_lines_removed;
  if (added + removed === 0) return null;
  return `${c.green}+${added}${c.reset} ${c.red}-${removed}${c.reset}`;
}
function cumulative(data) {
  const input = formatTokens(data.context_window.total_input_tokens);
  const output = formatTokens(data.context_window.total_output_tokens);
  return `${c.gray}\u2211 ${input} in ${output} out${c.reset}`;
}
function agent(data) {
  if (!data.agent?.name) return null;
  return `${c.magenta}\u{1F916} ${data.agent.name}${c.reset}`;
}
function worktree(data) {
  if (!data.worktree?.name) return null;
  return `${c.blue}\u2387 ${data.worktree.name}${c.reset}`;
}
function outputStyle(data) {
  const name = data.output_style?.name;
  if (!name || name === "default") return null;
  return `${c.gray}${name}${c.reset}`;
}
function mcp(count) {
  if (count < 1) return null;
  return `${c.yellow}\u26A1 ${count} mcp${c.reset}`;
}
function thinking(settings) {
  if (!settings.alwaysThinkingEnabled) return null;
  return `${c.gray}\u25D1 thinking${c.reset}`;
}
function ccVersion(data) {
  return `${c.dim}cc ${data.version}${c.reset}`;
}

// src/git.ts
var import_child_process = require("child_process");
var import_crypto = require("crypto");
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var os = __toESM(require("os"));
var CACHE_TTL = 5e3;
function hashCwd(cwd) {
  return (0, import_crypto.createHash)("md5").update(cwd).digest("hex").slice(0, 8);
}
function isCacheValid(cacheTs, now) {
  if (cacheTs === 0) return false;
  return now - cacheTs < CACHE_TTL;
}
function cachePath(cwd) {
  return path.join(os.tmpdir(), `claude-statusline-git-${hashCwd(cwd)}.json`);
}
function execGit(args, cwd) {
  try {
    return (0, import_child_process.execFileSync)("git", args, { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return "";
  }
}
function fetchGitInfo(cwd) {
  const gitDir = execGit(["rev-parse", "--git-dir"], cwd);
  if (!gitDir) return null;
  const branch = execGit(["branch", "--show-current"], cwd) || "HEAD";
  const statusOutput = execGit(["status", "--short"], cwd);
  const files = statusOutput ? statusOutput.split("\n").filter(Boolean).length : 0;
  const dirty = files > 0;
  let ahead = 0;
  let behind = 0;
  const counts = execGit(["rev-list", "--left-right", "--count", "HEAD...@{upstream}"], cwd);
  if (counts) {
    const parts = counts.split(/\s+/);
    ahead = parseInt(parts[0], 10) || 0;
    behind = parseInt(parts[1], 10) || 0;
  }
  return { branch, files, dirty, ahead, behind };
}
function getGitInfo(cwd) {
  const file = cachePath(cwd);
  const now = Date.now();
  try {
    const raw = fs.readFileSync(file, "utf-8");
    const cached = JSON.parse(raw);
    if (isCacheValid(cached.ts, now)) {
      return cached.data;
    }
  } catch {
  }
  const info = fetchGitInfo(cwd);
  try {
    fs.writeFileSync(file, JSON.stringify({ ts: now, data: info }));
  } catch {
  }
  return info;
}

// src/index.ts
function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    setTimeout(() => resolve(data), 2e3);
  });
}
function readSettings() {
  try {
    const settingsPath = path2.join(os2.homedir(), ".claude", "settings.json");
    return JSON.parse(fs2.readFileSync(settingsPath, "utf-8"));
  } catch {
    return {};
  }
}
function getMcpCount(settings) {
  return Object.keys(settings.mcpServers || {}).length;
}
async function main() {
  const input = await readStdin();
  if (!input.trim()) {
    console.log("Claude Code");
    process.exit(0);
  }
  let data;
  try {
    data = JSON.parse(input);
  } catch {
    console.log("Claude Code");
    process.exit(0);
  }
  const termWidth = process.stdout.columns || 120;
  const wide = termWidth >= 120;
  const sep = ` ${c.dim}\u2502${c.reset} `;
  const cwd = data.workspace?.current_dir || data.cwd || process.cwd();
  const gitInfo = getGitInfo(cwd);
  const settings = readSettings();
  const mcpCount = getMcpCount(settings);
  const line1Parts = [
    model(data),
    context(data, wide),
    remaining(data),
    ...wide ? [rate(data), maxOutput(data)] : [],
    directory(data, termWidth),
    git(gitInfo),
    ...wide ? [agent(data), worktree(data), mcp(mcpCount), thinking(settings)] : []
  ].filter(Boolean);
  console.log(line1Parts.join(sep));
  if (wide) {
    const line2Parts = [
      duration(data),
      lines(data),
      cumulative(data),
      outputStyle(data),
      ccVersion(data)
    ].filter(Boolean);
    console.log(line2Parts.join(sep));
  }
}
main();
