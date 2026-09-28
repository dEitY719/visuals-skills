# visuals — skill index

Three skills for turning content into something you can show. Each lives in this
extension's `skills/` directory. They are task-triggered: load the one that
matches the deliverable by reading its `SKILL.md`, then follow it. Do not load
all three.

| Skill | Read | Use when |
|-------|------|----------|
| `visualize` | `@./skills/visualize/SKILL.md` | The deliverable is a single self-contained HTML file — deck, dashboard, infographic, poster, flowchart, timeline, carousel. The default choice. |
| `md-to-scrolldeck` | `@./skills/md-to-scrolldeck/SKILL.md` | The input is one Markdown file and the deliverable is a vertical scroll-snap deck for leadership review. Narrower than `visualize`, and it owns the vertical scroll deck. |
| `excalidraw-diagram` | `@./skills/excalidraw-diagram/SKILL.md` | The deliverable is an `.excalidraw` file — an architecture or concept diagram meant to be edited afterwards — not HTML. |

Each skill's `references/` directory holds the detail it loads on demand;
`SKILL.md` says which file to read and when. Do not read `references/` files up
front — `visualize` alone has fifteen.

## Choosing between them

- Markdown file in, slides out, scrolled vertically -> `md-to-scrolldeck`.
- `.excalidraw` out -> `excalidraw-diagram`.
- Everything else visual -> `visualize`.

`visualize` will recommend a format when the user did not name one. Let it ask
rather than guessing.

## Tool mapping for Gemini CLI

The skills speak in actions. On Gemini CLI these resolve to:

- "Read a file" -> `read_file` / `read_many_files`
- "Create a file" / "edit a file" -> `write_file`, `replace`
- "Run a shell command" -> `run_shell_command`
- "Search file contents" -> `grep_search`
- "Find files by name" -> `glob`
- "Create a todo" -> `write_todos`
- "Ask the user" -> `ask_user`
- "Dispatch a subagent" -> `invoke_agent` with `agent_name: "generalist"`

The full mapping, including every capability gap and its workaround, lives in
the sibling repo `dEitY719/harness-skills` at
[`references/gemini-tools.md`](https://github.com/dEitY719/harness-skills/blob/main/references/gemini-tools.md).
Read it when a skill names a tool you do not recognise. On Antigravity read
[`references/antigravity-tools.md`](https://github.com/dEitY719/harness-skills/blob/main/references/antigravity-tools.md)
instead — `agy` shares `~/.gemini` but not Gemini CLI's tool names.

## Capability gaps on Gemini CLI

- **Image read-back.** `excalidraw-diagram` Step 5 renders the diagram to PNG
  and then *looks at it* to catch overlapping text and misaligned arrows. If the
  session cannot read the rendered image, run the render for the artifact but
  report the visual audit as skipped — never claim 27/27 quality items passed
  without having seen the PNG.
- **`${CLAUDE_PLUGIN_ROOT}` is not set.** It is a Claude Code variable. Every skill command that uses it (`excalidraw-diagram`'s render command, both HTML skills' vendored `lib/vendor/verify-html.sh` call) resolves the skill directory from `CLAUDE_PLUGIN_ROOT`, else `HERMES_SKILL_DIR`, and prints `[FAIL] skill dir unresolved` otherwise — export `CLAUDE_PLUGIN_ROOT` as the directory this plugin was installed into (the one holding `skills/`) before running it.
- **Renderer prerequisites.** That same step shells out to
  `uv run python render_excalidraw.py`, which needs `uv` and a Playwright
  Chromium. Without them, emit `[FAIL] visuals:excalidraw-diagram` at Step 5
  rather than delivering an unvalidated diagram.
- **Auto-open.** `visualize` and `md-to-scrolldeck` end by opening the file
  (`xdg-open` on Linux/WSL, `open` on macOS). In a headless session that is a
  no-op; report the `file://` path instead.

## Safety rules

- **One `write_file` call per output file, and never echo the generated HTML or
  `.excalidraw` JSON into chat.** Summary plus `file://` path only. Streaming a
  large generated file back is what truncates the turn — see
  `@./skills/visualize/references/bedrock-safe-write.md`.
- **Never invent data.** Charts, figures, and timelines use the user's real
  content; placeholder numbers are a defect, not a draft.
- `visualize` asks before choosing a format when the user did not name one, and
  `md-to-scrolldeck` prints its slide outline before writing any HTML. Use
  `ask_user`; an auto-approve session setting is not the user's answer.
- Every skill writes exactly one output file per run, at the path its `SKILL.md`
  derives. Honour a user-specified path over the default.
