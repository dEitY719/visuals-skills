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
| `excalidraw-diagram` | An `.excalidraw` architecture or concept diagram, rendered to PNG and self-audited against a 23-item checklist. |

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
lib/                                       helpers two or more skills share
docs/                                      GitHub Pages guides and samples
```

Only Claude Code understands the nested mono layout. The other five harnesses
resolve manifests at the repo root and a skills tree at `./skills/`, so nesting
would silently cut this plugin down to Claude-Code-only. **Do not move the
manifests back under a `plugins/` directory** — CI fails if `plugins/` exists.

## Shared assets live in harness-skills, not here

The per-harness tool mappings (`references/{codex,kimi,gemini,antigravity,
hermes,opencode}-tools.md`) are owned by `dEitY719/harness-skills`
(dEitY719/dotfiles#1410 F-5). **This repo carries no copy of them.** `GEMINI.md`,
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
  a command writes `/visuals:visualize`. The upstream `devx:` forms are gone —
  `~/dotfiles/claude/skills/` no longer exists, so there is no skill left for a
  `devx:` string to name. **A `devx:` string in this repo is always a bug, with
  no exception.** Skills that moved elsewhere in the split take their new repo's
  namespace: `restart` is now `session:restart` (`dEitY719/session-skills`).
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
  `skills/md-to-scrolldeck/references/font-and-bedrock-safety.md`. Those two are
  the **owners** of the rule — two of them on purpose, because the size tables
  and `Edit`-anchor advice genuinely differ per deliverable. Every other
  statement of the rule in `references/` is a pointer, never a copy; only each
  `SKILL.md` keeps a copy, because that is what a model reads on every run. A
  new delivery detail goes into the owner first.
- **`docs/skill-guides/<skill>.html` has no Markdown source, on purpose.** Each
  guide page is `skills/<skill>/SKILL.md` rendered directly by
  `/visuals:visualize`; every page's footer names that source path. **Do not add
  a `docs/skill-guides/<skill>.md`** — it would duplicate `SKILL.md`, and the
  original, the copy, and the HTML would then drift apart. To refresh a guide,
  re-render its `SKILL.md` through `/visuals:visualize` again — not generic
  markdown-to-HTML tooling, so the same rendering conventions apply. That
  re-render is an LLM call, not a deterministic build step, so there is no
  automated staleness check; the footer's named source path is the only
  freshness signal — re-render whenever `SKILL.md` changes underneath it.
- **`docs/skill-output/<skill>-usage.{md,html}` keeps both files.** These are
  records of one real run: the `.md` is the source, the `.html` is that
  source rendered by `/visuals:visualize` — the same tool and rule as
  `skill-guides` above, regardless of which skill the run demonstrates.
  Losing either one breaks the pair. `README.md` links a guide **and**
  a usage example per skill; keep both links when you add a skill.
- **Never invent data.** Charts, figures, and timelines use the user's real
  content. Placeholder numbers in an output are a defect.
- **Harness gaps are documented, not worked around silently.** When you add a
  step that depends on a Claude-Code-only capability, add the fallback to
  `GEMINI.md`, `.opencode/INSTALL.md`, and `.kimi-plugin/plugin.json`'s
  `skillInstructions` in the same commit, and open an issue against
  `harness-skills` if the shared mapping needs a new row.

## Emojis

No emojis in `README.md`, `CLAUDE.md`, `GEMINI.md`, any manifest, or any
`SKILL.md` — token efficiency.

**The one exception is vendored visual output.** `skills/visualize/examples/*`,
`skills/visualize/references/skeleton.md`, and `docs/**` ship example HTML —
posters, decks, infographics — where emoji are intentional design glyphs in the
rendered artwork, not prose decoration. `.github/workflows/validate.yml` exempts
exactly those paths from the shared "No emojis in tracked text" check via the
reusable workflow's `allow-emoji-paths` input; `skills/visualize/SKILL.md` and
the other reference files stay under the ban. See its comment and the README's
CI section.
Originally tracked as
[harness-skills#2](https://github.com/dEitY719/harness-skills/issues/2).

## Version bumps

The version appears in seven manifests: `.claude-plugin/marketplace.json`,
`.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`,
`.kimi-plugin/plugin.json`, `.hermes-plugin/plugin.yaml`,
`gemini-extension.json`, and `package.json`. CI checks that they agree — bump
all of them together. Versioning is independent per repo (dEitY719/dotfiles#1410 D-9); this repo
does not move in lockstep with its siblings.

## Author and licence attribution

Every manifest carries `author: dEitY719` (the packager) and `license: MIT`,
and nothing else. A `maintainer` object and a top-level `category` used to sit
beside them; both are outside Claude Code's plugin manifest schema, which
accepts only `name`, `version`, `description`, `author`, `homepage`,
`repository`, `license`, and `keywords` (2.1.x). An unknown top-level key fails
validation at **load** time — the plugin installs cleanly and then none of its
skills appear — so they were removed. Do not add them back, and do not add a
custom `skills` array either; the runtime auto-scans `skills/`.

**Upstream credit therefore lives in prose, not in the manifests.** `visualize`
is by careerhackeralex, `excalidraw-diagram` by coleam00, `md-to-scrolldeck` by
dEitY719. Three places carry that attribution and all three are load-bearing:
`README.md`'s Provenance section, `skills/visualize/SKILL.md`, and
`skills/excalidraw-diagram/README.md`. Dropping a third-party author's credit
from any of them is not a formatting change.
