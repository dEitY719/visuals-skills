# Excalidraw Diagram Skill

A Claude Code skill that generates beautiful, practical Excalidraw diagrams from natural language descriptions. Not just boxes-and-arrows — diagrams that **argue visually**.

This skill is shipped as part of the [`visuals`](../../README.md) plugin in the [`dEitY719/visuals-skills`](https://github.com/dEitY719/visuals-skills) marketplace.

## What Makes This Different

- **Diagrams that argue, not display.** Every shape (or group of shapes) mirrors the concept it represents — fan-outs for one-to-many, timelines for sequences, convergence for aggregation. No uniform card grids.
- **Evidence artifacts.** Technical diagrams include real code snippets and actual JSON payloads, not lorem ipsum.
- **Built-in visual validation.** A Playwright-based render pipeline lets the agent *see* its own output, catch layout issues (overlapping text, misaligned arrows, unbalanced spacing), and fix them in a loop before delivering.
- **Brand-customizable.** All colors and brand styles live in a single file (`references/color-palette.md`). Swap it out and every diagram follows your palette.

---

## Installation (for colleagues)

This skill is bundled inside the **`visuals`** plugin. You install the plugin once, and both `visualize` and `excalidraw-diagram` skills become available.

### 1. Add the marketplace and install the plugin

Inside a Claude Code session:

```
/plugin marketplace add dEitY719/visuals-skills
/plugin install visuals@visuals-skills
```

Verify both skills are registered:

```
/plugin list
```

You should see `visuals` listed, and the bundled skills `visualize`, `excalidraw-diagram`, and `md-to-scrolldeck` will be discoverable by Claude.

### 2. Install the VSCode Excalidraw extension (required)

`.excalidraw` files are JSON. To **view and edit** them visually, install the official Excalidraw VSCode extension:

- Marketplace: [Excalidraw](https://marketplace.visualstudio.com/items?itemName=pomdtr.excalidraw-editor)
- Or via CLI:

  ```bash
  code --install-extension pomdtr.excalidraw-editor
  ```

Once installed, double-clicking any `.excalidraw` file in VSCode opens the Excalidraw editor — you can pan, zoom, edit shapes, change colors, and export to PNG/SVG directly from the IDE.

> **Why this is required:** the skill produces `.excalidraw` JSON. Without the extension VSCode shows raw JSON; with the extension you get the full Excalidraw editing experience.

### 3. Set up the render pipeline (one-time, recommended)

The skill validates its output by rendering the generated `.excalidraw` file to PNG and inspecting it. Two ways to set this up:

**Option A — Ask the agent (easiest):**

> "Set up the Excalidraw diagram skill renderer by following the instructions in SKILL.md."

Claude will run the commands for you.

**Option B — Manual:**

```bash
cd ~/.claude/plugins/visuals/skills/excalidraw-diagram   # adjust if different
uv sync
cd references && uv run playwright install chromium
```

This installs `playwright` and a headless Chromium browser (~200MB). It only needs to run once per machine.

### 4. Updating or removing

```
/plugin update visuals
/plugin uninstall visuals
```

---

## User Guide

### Quick start

Just describe what you want to visualize:

> "Create an Excalidraw diagram showing how the AG-UI protocol streams events from an AI agent to a frontend UI"

> "Diagram our microservice topology: API gateway, auth service, two worker pools, and a Redis cache"

> "Visualize the lifecycle of a Kubernetes pod from scheduling to termination"

The skill handles the rest — concept mapping, layout, JSON generation, rendering, and visual validation. The output is a `.excalidraw` file in your project, plus (optionally) a PNG preview.

### Triggering the skill

Claude auto-invokes this skill when it sees phrases like:

- *"draw a diagram of…"*
- *"visualize this architecture / workflow / concept"*
- *"create an excalidraw diagram"*
- *"make me a system diagram for…"*

You can also force it: `Use the excalidraw-diagram skill to draw …`.

### Choosing the right depth

The skill picks one of two modes based on your prompt:

| Mode | When to use | Output style |
|------|-------------|--------------|
| **Simple** | Mental models, concept explainers, abstract relationships | Abstract shapes, labels, clean relationships |
| **Comprehensive** | Real systems, production architecture, technical deep-dives | Multi-zoom layout with real code snippets and JSON payloads as evidence |

If you want comprehensive output, say so: *"a detailed diagram with code examples"* or *"production-grade architecture"*.

### Iterating

After the first render, you can ask for changes naturally:

- *"Move the cache to the right of the worker pool"*
- *"Use red for error paths"*
- *"Add a sequence number to each arrow"*
- *"Re-render and show me the PNG"*

The skill re-validates after each change.

### Output files

By default the skill writes to your current working directory:

- `<name>.excalidraw` — the editable diagram (open in VSCode with the extension)
- `<name>.png` — the rendered preview (optional, only if the render pipeline is set up)

You can specify a path: *"Save it to `docs/architecture/auth-flow.excalidraw`"*.

### Customizing the brand palette

Edit `references/color-palette.md` inside the skill directory to change brand colors. Every subsequent diagram automatically follows the new palette. The rest of the skill (layout, design rules, patterns) is universal and palette-independent.

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| `.excalidraw` opens as raw JSON in VSCode | Install the [Excalidraw extension](https://marketplace.visualstudio.com/items?itemName=pomdtr.excalidraw-editor). |
| `uv: command not found` during setup | Install [uv](https://docs.astral.sh/uv/getting-started/installation/) first: `curl -LsSf https://astral.sh/uv/install.sh \| sh`. |
| Playwright fails to launch Chromium | Re-run `uv run playwright install chromium`. On Linux you may also need `uv run playwright install-deps`. |
| Skill not auto-triggering | Confirm with `/plugin list` that `visuals` is installed; restart your Claude Code session if it was just added. |
| Diagram looks like generic boxes | Tell the agent to "use varied visual patterns — fan-out, convergence, timeline — not a uniform grid." The skill is designed to argue visually; nudge it if it falls back to defaults. |

---

## File Structure

```
excalidraw-diagram/
├── SKILL.md                          # Workflow control tower (what Claude reads first)
├── README.md                         # This file
├── pyproject.toml                    # Python deps (playwright)
├── uv.lock                           # Locked dependency versions
└── references/
    ├── color-palette.md              # Brand colors (edit this to customize)
    ├── design-rules.md               # Container, color, aesthetics, layout, text rules
    ├── element-templates.md          # JSON templates for each element type
    ├── evidence-and-research.md      # Research mandate, evidence artifacts, multi-zoom
    ├── help.md                       # `-h` / `--help` output, verbatim
    ├── json-schema.md                # Excalidraw JSON format reference
    ├── large-diagram-strategy.md     # Section-by-section build workflow
    ├── output-format.md              # Output path, filename convention, artifacts
    ├── quality-checklist.md          # 23-item validation checklist
    ├── render-validate.md            # Render-view-fix loop process
    ├── render_excalidraw.py          # Render .excalidraw to PNG
    ├── render_template.html          # Browser template for rendering
    └── visual-patterns.md            # Pattern library and shape meaning
```

---

## Credits

- Original skill: [coleam00/excalidraw-diagram-skill](https://github.com/coleam00/excalidraw-diagram-skill), MIT licensed.
- Repackaged for the `visuals` plugin (`dEitY719/visuals-skills`) by [@dEitY719](https://github.com/dEitY719).

## License

MIT — see the repository [LICENSE](../../LICENSE).
