# visuals-skills — Contributor Guidelines

This file is the AI context document for this repo. `AGENTS.md` is a symlink to
it, so Claude Code, Codex, Gemini CLI, and every other harness read the same
text. Edit `CLAUDE.md`; never replace the symlink with a second copy.

## What this repo is

A single-plugin skill marketplace. The plugin is named `visuals` and it bundles
three skills that turn content into a visual deliverable:

| Skill | Role |
|-------|------|
| `visualize` | One self-contained HTML file — deck, dashboard, infographic, poster, flowchart, timeline, carousel. The general-purpose default. |
| `md-to-scrolldeck` | One Markdown file into a vertical scroll-snap deck (scrollytelling) for leadership review. |
| `excalidraw-diagram` | An `.excalidraw` architecture or concept diagram, rendered to PNG and self-audited against a 27-item checklist. |

The boundary between them is the deliverable, not the topic: `.excalidraw` file
-> `excalidraw-diagram`; Markdown in and a vertical scroll deck out ->
`md-to-scrolldeck`; everything else visual -> `visualize`. Each `SKILL.md` ends
with a "Related Skills" section stating that boundary — keep those three in sync
when you change one.

The skills were extracted from `dEitY719/dotfiles` (`claude/skills/devx-*`) as a
snapshot — see the conversion commit for the source SHA. The dotfiles copies
remain in place for now; they are removed in a later phase of that repo's
migration plan.

## Layout: root manifests, one flat `skills/`

This repo deliberately does **not** use the nested `plugins/<name>/skills/`
"mono" layout it started life with. Every harness manifest sits at the repo root
and points at a single flat `./skills/` directory:

```
.claude-plugin/{marketplace,plugin}.json   Claude Code
.codex-plugin/plugin.json                  Codex
.kimi-plugin/plugin.json                   Kimi CLI
.hermes-plugin/{plugin.yaml,__init__.py}   Hermes Agent
.opencode/plugins/visuals.js               OpenCode
.agents/plugins/marketplace.json           Antigravity
gemini-extension.json + GEMINI.md          Gemini CLI
skills/<name>/SKILL.md                     the skills themselves
docs/                                      GitHub Pages guides and samples
```

Only Claude Code understands the nested mono layout. The other five harnesses
resolve manifests at the repo root and a skills tree at `./skills/`, so nesting
would silently cut this plugin down to Claude-Code-only. **Do not move the
manifests back under a `plugins/` directory** — CI fails if `plugins/` exists.

## Shared assets live in harness-skills, not here

The per-harness tool mappings (`references/{codex,kimi,gemini,antigravity,
hermes,opencode}-tools.md`) are owned by `dEitY719/harness-skills` (dotfiles
#1410 F-5). **This repo carries no copy of them.** `GEMINI.md`,
`.opencode/INSTALL.md`, and `.kimi-plugin/plugin.json` link to
`https://github.com/dEitY719/harness-skills/blob/main/references/<harness>-tools.md`
instead. If you are about to paste one of those files in here, stop and add a
link — one tool rename must stay one edit across all fifteen repos (NF-2).

## Rules for changing skills

- **Skill directory name is the identity.** `skills/<name>/` must match the
  `name:` field in that skill's `SKILL.md` frontmatter, and that field is the
  **bare** name (`visualize`), never namespaced (`visuals:visualize`). The
  harness supplies the `visuals:` prefix at invocation time. CI hard-fails on a
  `name:` containing a colon.
- **Invocation form in prose is namespaced.** Body text referring to a skill as
  a command writes `/visuals:visualize`. The upstream `devx:` forms these skills
  carried in dotfiles are gone from this repo; a `devx:` string here is a bug
  unless it names a skill that stayed in dotfiles (e.g. `devx:restart`).
- **Progressive disclosure.** `SKILL.md` stays under 100 lines (CI enforces it)
  and names which `references/` file to read and when. Detail lives in
  `references/`. Do not inline a reference file back into `SKILL.md`.
- **Description budget.** CI sums every skill description and fails past 5,440
  characters — Codex's context budget. Keep new descriptions tight.
- **Honour the write contract.** Every skill writes exactly one output file per
  run, in a single `Write` call, and never echoes the generated HTML or
  `.excalidraw` JSON back into chat — a summary plus a `file://` path only. The
  failure mode this prevents is documented in
  `skills/visualize/references/bedrock-safe-write.md` and
  `skills/md-to-scrolldeck/references/font-and-bedrock-safety.md`.
- **Never invent data.** Charts, figures, and timelines use the user's real
  content. Placeholder numbers in an output are a defect.
- **Harness gaps are documented, not worked around silently.** When you add a
  step that depends on a Claude-Code-only capability, add the fallback to
  `GEMINI.md`, `.opencode/INSTALL.md`, and `.kimi-plugin/plugin.json`'s
  `skillInstructions` in the same commit, and open an issue against
  `harness-skills` if the shared mapping needs a new row.

## Eval pipeline (`eval/`)

`eval/` is the quality loop for the `visualize` skill, imported from the
retired `dEitY719/visualize` fork (archived rounds and screenshots were left
behind). It is contributor tooling, not a skill: it sits outside `skills/` so no
harness loads `eval/SKILL.md`. Run Layer 1 + 2 with
`cd eval/pipeline && npm install && node run.js --dir ../../skills/visualize/examples/`;
Layer 3 (visual quality) is scored by the agent from the captured screenshots.
See `eval/EVAL.md` for scoring and `eval/LOOP.md` for the improvement loop.

## Emojis

No emojis in `README.md`, `CLAUDE.md`, `GEMINI.md`, any manifest, or any
`SKILL.md` — token efficiency.

**The one exception is vendored visual output.** `skills/visualize/examples/*`
and `docs/**` ship example HTML — posters, decks, infographics — where emoji are
intentional design glyphs in the rendered artwork, not prose decoration.
Fifteen tracked files carry them. That is why `.github/workflows/validate.yml`
omits the shared "No emojis in tracked text" check; see its comment and the
README's CI section for the follow-up condition, tracked as
[harness-skills#2](https://github.com/dEitY719/harness-skills/issues/2).

## Version bumps

The version appears in seven manifests: `.claude-plugin/marketplace.json`,
`.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`,
`.kimi-plugin/plugin.json`, `.hermes-plugin/plugin.yaml`,
`gemini-extension.json`, and `package.json`. CI checks that they agree — bump
all of them together. Versioning is independent per repo (#1410 D-9); this repo
does not move in lockstep with its siblings.

## Author and licence attribution

`.claude-plugin/plugin.json` splits `author` (the original skill authors:
`visualize` by careerhackeralex, `excalidraw-diagram` by coleam00,
`md-to-scrolldeck` by dEitY719) from `maintainer` (dEitY719, who repackaged
them). The licence is MIT. That split is a requirement, not a style choice —
preserve all three fields verbatim through any manifest edit.
