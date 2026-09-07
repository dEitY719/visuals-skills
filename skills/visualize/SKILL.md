---
name: visualize
description: >-
  Create a self-contained HTML file — dashboard, infographic, deck. Use for
  /visuals:visualize, "visualize this", "이거 시각화해줘". 인챗 차트/Artifact 는
  built-in dataviz, Excalidraw 는 visuals:excalidraw-diagram, 세로 스크롤 덱은
  visuals:md-to-scrolldeck.
license: MIT
metadata:
  author: careerhackeralex
  version: 0.3.2
  category: document-creation
  model_recommendation:
    tier: sonnet
    reason: "HTML generation, bounded creativity"
    claude: prefer
    non_claude: advisory-only
  tags: [visualization, html, slides, dashboard, infographic]
---

# Visualize

## Help

If args is `-h`/`--help`/`help`, read `references/help.md` verbatim and stop.

## After Creating a File

**Always do ALL THREE after writing the HTML file:**
1. **Auto-open:** `xdg-open <filename>.html` (Linux/WSL) · `open <filename>.html` (macOS). **Do NOT use `wslview`** — it frequently errors on HTML files; `xdg-open` works reliably on WSL.
2. **Return URL:** Include `file://<absolute-path>` in response.
3. **Do NOT echo the generated HTML body into chat.** Summary + URL + open command only — no `<head>` preview, no inline excerpt, no rendered code block. The user opens the file via the URL. See [references/bedrock-safe-write.md](references/bedrock-safe-write.md) for the failure mode this prevents (AWS Bedrock `Truncated event message received`).

```
[OK] visuals:visualize type=<dashboard|deck|poster|...> out=<path>
file://<absolute-path>
```

On failure: `[FAIL] visuals:visualize step=<n> detail=<reason>`.

## Critical Requirements

See [references/requirements.md](references/requirements.md) for the full list.

## Core Principles

1. **Single-file HTML** — one `.html` file, inline CSS/JS, opens anywhere, works offline.
2. **Light theme optimized** — modern designs prioritize light mode. Dark available via toggle.
3. **Beautiful by default** — first output looks professional with zero iteration.
4. **Content-first** — visualization serves the message. Never sacrifice clarity for aesthetics.
5. **Responsive** — works on desktop, tablet, mobile unless explicitly fixed-dimension.
6. **Visual restraint** — no floating gradient orbs, rainbow borders, or ornamental animations.

## Output Rules

Start from [references/skeleton.md](references/skeleton.md) — **NEVER write HTML from scratch.**

- Write ONE `.html` file. Path rules:
  1. **File input** (`/visualize /path/abc.md`) → same dir, same basename, `.html` extension
  2. **No file input** → `~/Downloads/` with descriptive kebab-case name
  3. **User-specified path** → always honor it
- For Reveal.js nav pattern and full CDN library list, see [references/libraries.md](references/libraries.md).
- SVG for icons and simple graphics — never external image URLs unless user provides them.

## Design System

Full specs in [references/design-system.md](references/design-system.md) (typography, color, spacing, animation, accessibility) and [references/css-techniques.md](references/css-techniques.md) (advanced CSS, glass morphism, scroll techniques).

Key: Inter font mandatory, class-based theming only, `--bg/--surface/--text/--accent/--border` minimum CSS vars.

## Visualization Types

Choose the right format: structural patterns in [references/types.md](references/types.md), type-specific rules (Carousel, Slide Deck, Poster, Auto-Recommend workflow, interactivity, layout variation) in [references/type-rules.md](references/type-rules.md).

When user provides content **without specifying format**: analyze → recommend 1-2 formats → wait for confirmation. See type-rules.md for the content-to-type mapping table.

## Context Awareness

This skill runs mid-conversation. Use all available context: conversation history, URLs (crawl + extract), pasted data (CSV/JSON → charts), code/architecture (→ system diagrams). Always use real content — never placeholder data.

## Process

Run these in order. Stop and emit `[FAIL]` (see above) on an unloadable skeleton, an unresolved ambiguous format, or an unfixed `verify-html.sh` failure.

1. **Understand** — message, audience, format. If format unclear, run Auto-Recommend from [references/type-rules.md](references/type-rules.md) and wait for confirmation — never guess a format.
2. **Start from skeleton** — [references/skeleton.md](references/skeleton.md). NEVER start blank; if it cannot be loaded, stop and emit `[FAIL]`.
3. **Structure** — outline sections before filling the skeleton.
4. **Build** — add content, charts, styles. All colors as CSS vars.
5. **Verify** — `bash "${CLAUDE_PLUGIN_ROOT}/lib/verify-html.sh" --profile viz <out>.html` must exit 0, then the human-judgement items in [references/checklist.md](references/checklist.md).

Chart.js patterns → [references/chartjs-patterns.md](references/chartjs-patterns.md) | Debugging → [references/debugging.md](references/debugging.md) | Bedrock-safe delivery → [references/bedrock-safe-write.md](references/bedrock-safe-write.md)

## Related Skills

`visuals:md-to-scrolldeck` — a Markdown file into a vertical scroll-snap deck;
this skill owns everything else (dashboards, infographics, posters, horizontal
decks) · `visuals:excalidraw-diagram` — when the deliverable is an `.excalidraw`
file, not HTML.
