# visuals-skills

Three skills for turning content into something you can show — a self-contained
HTML deck or dashboard, a vertical scroll deck built from a Markdown report, or
an Excalidraw architecture diagram. Packaged as a single plugin named `visuals`,
installable on six coding-agent harnesses.

## Skills

| Skill | Invoke | What it does |
|-------|--------|--------------|
| `visualize` | `/visuals:visualize [<file-or-content>]` | Writes one self-contained HTML file — deck, dashboard, infographic, poster, flowchart, timeline, carousel. Starts from a fixed skeleton and a design system, never from a blank page. The general-purpose default. |
| `md-to-scrolldeck` | `/visuals:md-to-scrolldeck <input.md> [--slides n] [--outline-only]` | Compresses one Markdown document into a vertical scroll-snap deck (scrollytelling) for leadership review: progress bar, phase header, dot rail, arrow-key nav, print-ready. Prints its slide outline before writing anything. |
| `excalidraw-diagram` | `/visuals:excalidraw-diagram <topic-or-spec>` | Generates `.excalidraw` JSON that argues visually rather than labelling boxes, renders it to PNG, looks at the render, and fixes it against a 23-item checklist before delivering. |

Pick by deliverable, not by topic: `.excalidraw` file -> `excalidraw-diagram`;
Markdown in and a vertical scroll deck out -> `md-to-scrolldeck`; everything
else visual -> `visualize`.

### Visual guides and worked examples (GitHub Pages)

- `visualize` — [visual guide](https://deity719.github.io/visuals-skills/skill-guides/visualize.html) · [usage example](https://deity719.github.io/visuals-skills/skill-output/visualize-usage.html) (Markdown to HTML output)
- `md-to-scrolldeck` — [visual guide](https://deity719.github.io/visuals-skills/skill-guides/md-to-scrolldeck.html) · [usage example](https://deity719.github.io/visuals-skills/skill-output/md-to-scrolldeck-usage.html) (Markdown to vertical scroll deck)
- `excalidraw-diagram` — [visual guide](https://deity719.github.io/visuals-skills/skill-guides/excalidraw-diagram.html) · [usage example](https://deity719.github.io/visuals-skills/skill-output/excalidraw-diagram-usage.html) (prompt to diagram)

Both trees are in the repo — [`docs/skill-guides/`](docs/skill-guides) holds the
rendered skill references, and [`docs/skill-output/`](docs/skill-output) keeps
each usage example's Markdown source beside its rendered page.

`excalidraw-diagram` also has its own
[README](skills/excalidraw-diagram/README.md) covering VSCode setup and the
render pipeline.

## Install

### Claude Code

```
/plugin marketplace add dEitY719/visuals-skills
/plugin install visuals@visuals-skills
```

### Codex

```
codex plugin install dEitY719/visuals-skills
```

### Kimi CLI

```
kimi plugin install dEitY719/visuals-skills
```

### Hermes Agent

```
hermes plugins install dEitY719/visuals-skills
```

### OpenCode

See [`.opencode/INSTALL.md`](.opencode/INSTALL.md).

### Gemini CLI / Antigravity

```
gemini extensions install https://github.com/dEitY719/visuals-skills
```

Antigravity (`agy`) shares `~/.gemini`, so it inherits the install.

### From the shell (npx)

```
npx skills add https://github.com/dEitY719/visuals-skills
```

## Harness support

These skills are written in Claude Code's vocabulary, but they lean on very
little that is Claude-Code-specific: they read files, write one output file, and
run a shell command. The per-harness tool mappings live in the sibling repo
[`dEitY719/harness-skills`](https://github.com/dEitY719/harness-skills/tree/main/references);
read the one file for the harness you are on.

| Skill | Claude Code | Codex | Kimi | Gemini / Antigravity | Hermes | OpenCode |
|-------|:-----------:|:-----:|:----:|:--------------------:|:------:|:--------:|
| `visualize` | full | full | full | full | full | full |
| `md-to-scrolldeck` | full | full | full | full | full | full |
| `excalidraw-diagram` | full | needs image read-back | needs image read-back | needs image read-back | needs image read-back | needs image read-back |

*needs image read-back* — Step 3 renders the diagram to PNG and then *looks at
it* to catch overlapping text and misaligned arrows. A harness that cannot read
an image back still produces the `.excalidraw` and the PNG, but must report the
visual audit as skipped rather than claiming 23/23 quality items passed. That
step also needs `uv` and a Playwright Chromium on the machine.

Auto-open (`xdg-open` / `open`) is a no-op in a headless session; the skills
report the `file://` path instead.

## Layout

Manifests live at the repo root and all point at one flat `skills/` directory:

```
.
├── skills/{visualize,md-to-scrolldeck,excalidraw-diagram}/
│   ├── SKILL.md
│   ├── references/
│   └── examples/ · evals/
├── docs/                                        GitHub Pages guides + samples
├── .claude-plugin/{marketplace,plugin}.json     Claude Code
├── .codex-plugin/plugin.json                    Codex
├── .kimi-plugin/plugin.json                     Kimi CLI
├── .hermes-plugin/{plugin.yaml,__init__.py}     Hermes Agent
├── .opencode/plugins/visuals.js + INSTALL.md    OpenCode
├── .agents/plugins/marketplace.json             Antigravity
├── gemini-extension.json + GEMINI.md            Gemini CLI
├── package.json
├── CLAUDE.md · AGENTS.md -> CLAUDE.md
└── LICENSE
```

Only Claude Code understands a nested `plugins/<name>/skills/` layout. The other
five harnesses resolve manifests at the repo root and a skills tree at
`./skills/`, so this repo keeps everything flat — the nested layout it shipped
with through v0.4.0 is gone. See [`CLAUDE.md`](CLAUDE.md) for the full rationale
and contribution rules.

The `.kimi-plugin/` manifest is pre-provisioned: Kimi CLI is not installed on the
maintainer's machines yet, and shipping the manifest now costs nothing and saves
a migration later.

## CI

[`.github/workflows/validate.yml`](.github/workflows/validate.yml) is a `uses:`
call to
[`harness-skills/.github/workflows/skill-check.yml`](https://github.com/dEitY719/harness-skills/blob/main/.github/workflows/skill-check.yml),
the same reusable workflow every other `dEitY719/*-skills` repo validates
through — manifests, skill frontmatter, progressive-disclosure line limits, the
Codex description budget, version agreement across all seven version-bearing
manifests, plugin-name consistency, the `AGENTS.md` symlink, the flat layout,
and shell scripts.

That shared workflow bans emoji in tracked text, and this repo's `visualize`
skill ships example HTML — posters, decks, infographics — that uses emoji as
intentional design glyphs in the rendered artwork. `validate.yml` exempts
exactly those paths with the workflow's `allow-emoji-paths` input rather than
inlining every other check to omit just that one. The repo-specific `lib/verify-html.sh --selftest` check — not
part of the shared workflow — runs via the `tests/*.sh` convention the shared
workflow auto-discovers; see
[`tests/verify-html-selftest.sh`](tests/verify-html-selftest.sh). Originally
tracked as
[harness-skills#2](https://github.com/dEitY719/harness-skills/issues/2).

## Provenance

These skills were extracted from
[`dEitY719/dotfiles`](https://github.com/dEitY719/dotfiles)
(`claude/skills/devx-{visualize,md-to-scrolldeck,excalidraw-diagram}`) as a
content snapshot — no history rewriting. The source commit SHA is recorded in
this repo's conversion commit message. The `devx-` prefix is dropped here
because the plugin namespace (`visuals:`) now supplies it. The dotfiles copies
stay in place until Phase 4 of that repo's migration plan.

`visualize` and `excalidraw-diagram` originate upstream — `visualize` by
careerhackeralex, `excalidraw-diagram` by
[coleam00](https://github.com/coleam00/excalidraw-diagram-skill);
`md-to-scrolldeck` was written by [@dEitY719](https://github.com/dEitY719).
The manifests carry only `author: dEitY719` (the packager) and `license: MIT`,
because Claude Code's manifest schema rejects any other top-level field, so
this section is where upstream authorship is recorded.

This is Phase 1 of the dotfiles #1410 migration; `packaging-skills` was Phase 0
and `harness-skills` is its sibling in this phase.

## License

MIT. See [LICENSE](LICENSE).
