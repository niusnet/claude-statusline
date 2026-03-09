# claude-statusline

Configure your Claude Code statusline to show limits, directory and git info

![demo](./.github/demo.png)

## Install

Run the command below to set it up

```bash
npx @kamranahmedse/claude-statusline
```

It backups your old status line if any and copies the status line script to `~/.claude/statusline.sh` and configures your Claude Code settings.

## Extras included

- Git ahead/behind indicators (`↑`/`↓`) when your branch has an upstream
- Claude Code version indicator (`cc x.y.z`) and update hint (`⇪ x.y.z`) when a newer npm release is detected
- API freshness status (`api: live` / `api: stale`) for usage data
- Relative reset times (e.g. `in 1h 20m`) next to absolute reset times

## Optional environment variables

Tune thresholds and cache behavior:

```bash
export CLAUDE_STATUSLINE_CONTEXT_WARN_PCT=50
export CLAUDE_STATUSLINE_CONTEXT_MID_PCT=70
export CLAUDE_STATUSLINE_CONTEXT_CRIT_PCT=90
export CLAUDE_STATUSLINE_CACHE_MAX_AGE=60
export CLAUDE_STATUSLINE_SHOW_API_STATUS=false
export CLAUDE_STATUSLINE_SHOW_CLI_VERSION=true
export CLAUDE_STATUSLINE_CHECK_UPDATES=true
export CLAUDE_STATUSLINE_UPDATE_CACHE_MAX_AGE=43200
```

Notes:

- `CLAUDE_STATUSLINE_SHOW_API_STATUS` is off by default to avoid confusion in plans where API freshness is not useful.
- Update checks query npm and are cached (12h by default).

```

## Requirements

- [jq](https://jqlang.github.io/jq/) — for parsing JSON
- curl — for fetching rate limit data
- git — for branch info
- bash — required on Windows (Git Bash works)

On macOS:

```bash
brew install jq
```

On Windows 11:

```powershell
winget install -e --id Git.Git
winget install -e --id jqlang.jq
```

> `curl` ships with modern Windows, and Git for Windows provides `bash`.


## Uninstall

```bash
npx @kamranahmedse/claude-statusline --uninstall
```

If you had a previous statusline, it restores it from the backup. Otherwise it removes the script and cleans up your settings.

## License

MIT
