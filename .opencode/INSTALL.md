# Installing visuals for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed

## Installation

Add the plugin to the `plugin` array in your `opencode.json` (global or
project-level):

```json
{
  "plugin": ["visuals-skills@git+https://github.com/dEitY719/visuals-skills.git"]
}
```

Restart OpenCode. The plugin installs through OpenCode's plugin manager and
registers all three skills.

OpenCode uses its own plugin install. If you also use Claude Code, Codex, or
another harness, install this plugin separately for each one.

## Usage

Use OpenCode's native `skill` tool:

```
use skill tool to list skills
use skill tool to load visualize
```

## Tool mapping

The authoritative OpenCode tool mapping for every `dEitY719/*-skills` repo lives
in the sibling repo `dEitY719/harness-skills` at
[`references/opencode-tools.md`](https://github.com/dEitY719/harness-skills/blob/main/references/opencode-tools.md).
Read it when a skill names a tool you do not recognise. Short version:

- "Read a file" -> `read`
- "Create a file" / "edit a file" -> `apply_patch`
- "Run a shell command" -> `bash`
- "Search file contents" / "find files by name" -> `grep`, `glob`
- "Create a todo" -> `todowrite`
- "Ask the user" -> OpenCode has no dedicated ask tool; print the choice and
  stop your turn so the user can answer
- "Dispatch a subagent" -> `task` with `subagent_type: "general"` (or
  `"explore"` for read-only repo exploration)
- "Invoke a skill" -> OpenCode's native `skill` tool

Each skill writes exactly one output file per run with a single `apply_patch`
call, and never echoes the generated HTML or `.excalidraw` JSON back into chat.

## Capability notes

- `visualize` and `md-to-scrolldeck` auto-open the file they wrote (`xdg-open`
  on Linux/WSL, `open` on macOS). In a headless OpenCode session that step is a
  no-op — report the `file://` path instead.
- `${CLAUDE_PLUGIN_ROOT}` is a Claude Code variable and is unset here. Every skill command that uses it (`excalidraw-diagram`'s render command, both HTML skills' vendored `lib/vendor/verify-html.sh` call) resolves the skill directory from `CLAUDE_PLUGIN_ROOT`, else `HERMES_SKILL_DIR`, and prints `[FAIL] skill dir unresolved` otherwise — export `CLAUDE_PLUGIN_ROOT` as the directory this plugin was installed into (the one holding `skills/`) before running it.
- `excalidraw-diagram` Step 5 renders the diagram to PNG with
  `uv run python render_excalidraw.py` and then reads the image back to audit
  it. If your OpenCode session cannot read images, say so and skip the visual
  audit rather than claiming all 27 quality items passed.

## Troubleshooting

### Plugin not loading

1. Check logs: `opencode run --print-logs "hello" 2>&1 | grep -i visuals`
2. Verify the plugin line in your `opencode.json`
3. Make sure you are running a recent version of OpenCode

### Skills not found

1. Use the `skill` tool to list what was discovered
2. Check that the plugin is loading (see above)

## Getting Help

Report issues: https://github.com/dEitY719/visuals-skills/issues
