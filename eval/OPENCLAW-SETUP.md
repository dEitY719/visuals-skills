# OpenClaw Setup — Visualize Self-Improvement Loop

> Give this prompt to OpenClaw to create a recurring job that improves the Visualize plugin automatically.

---

## Prompt for OpenClaw

```
Create a recurring cron job that runs every 3 hours to improve the Visualize Claude Code plugin.

## What This Job Does

Each run executes one round of a self-improvement loop for an open-source Claude Code plugin (https://github.com/careerhackeralex/visualize). The loop generates HTML visualizations using the plugin, scores them with an automated eval pipeline, identifies weaknesses in the skill instructions, fixes them, and pushes improvements back to GitHub.

## Setup

1. Clone the repo: `git clone https://github.com/careerhackeralex/visualize.git`
2. The full agent prompt is at: `eval/pipeline/LOOP-PROMPT.md`
3. Pass the ENTIRE contents of that file as the agent prompt for each run

## Schedule

- Run every 3 hours
- If a previous run is still in progress, skip this run (no overlapping)
- Maximum runtime per run: 60 minutes — kill the job if it exceeds this

## Agent Requirements

The agent running each job needs:
- **Shell access** — to run git, node, and claude CLI commands
- **File system access** — to read/write files in the cloned repo
- **Git push access** — to push commits to https://github.com/careerhackeralex/visualize.git (configure SSH key or token)
- **Claude Code CLI** — `claude` must be in PATH (the harness handles authentication)
- **Node.js** — `node` and `npm` must be available (for the eval pipeline)
- **Playwright** — installed via `cd eval/pipeline && npm install` on first run

## Per-Run Behavior

Each run should:
1. Clone a fresh copy of the repo (or pull latest)
2. Read `eval/loop-state.json` — if `gate` is `SHIP` or `VIRAL`, skip the run and report "quality gate reached"
3. Execute the full loop defined in `eval/pipeline/LOOP-PROMPT.md`
4. The agent will commit and push results back to the repo
5. Clean up the working directory after completion

## Stop Conditions

Stop scheduling new runs when:
- `eval/loop-state.json` shows `gate: "SHIP"` or `gate: "VIRAL"` for 3 consecutive runs
- After that, switch to once-per-day maintenance checks

## Logging

- Save stdout/stderr of each run to a log file
- Include the round number, gate status, and average score in the job summary
- On failure, capture the error and continue with the next scheduled run

## Environment Variables Needed

- Git credentials (SSH key or GitHub token) with push access to careerhackeralex/visualize
```

---

## Notes for Manual Setup

If OpenClaw needs more specific configuration:

- **Job name:** `visualize-improvement-loop`
- **Schedule:** `0 */3 * * *` (every 3 hours at minute 0)
- **Timeout:** 3600 seconds (60 minutes)
- **Concurrency:** 1 (never run two loops simultaneously)
- **Retry on failure:** No — log the error and wait for next scheduled run
- **Agent model:** Sonnet (for the outer loop agent; inner generation also uses Sonnet)
