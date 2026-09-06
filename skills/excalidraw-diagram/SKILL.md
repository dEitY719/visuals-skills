---
name: excalidraw-diagram
description: Create an editable .excalidraw diagram JSON that argues visually. Trigger "/visuals:excalidraw-diagram" or when the user wants a diagram to edit in Excalidraw, not artifact-rendered (artifact-diagramming/mermaid). (HTML 슬라이드/대시보드는 visuals:visualize)
license: MIT
compatibility:
  network: required
metadata:
  model_recommendation:
    tier: sonnet
    reason: "generative diagram JSON with bounded creativity; visual pattern mapping + 23-item quality check"
    claude: prefer
    non_claude: advisory-only
---

# Excalidraw Diagram Creator

## Help

If args is `-h`/`--help`/`help`, read `references/help.md` verbatim and stop.

Generate `.excalidraw` JSON files that **argue visually**, not just display information. **Setup:** see `README.md` for renderer setup and dependencies.

## Customization

Read `references/color-palette.md` before generating any diagram — single source of truth for all colors and brand styles. Edit it to change your brand.

## Core Philosophy

**Diagrams should ARGUE, not DISPLAY.** The shape should BE the meaning.

- **Isomorphism Test**: Remove all text — does the structure alone communicate the concept?
- **Education Test**: Could someone learn something concrete, or does it just label boxes?

## Design Process

Run these steps in order. Stop immediately on any error (topic-too-vague refusal, renderer unavailable, quality-item failure) and emit a `[FAIL]` verdict.

### Step 0: Assess Depth

Determine: **simple** (abstract shapes, mental models) or **comprehensive** (real systems, architecture)?

- Simple → abstract shapes, labels, relationships
- Comprehensive → read `references/evidence-and-research.md` for research mandate, evidence artifacts, and multi-zoom architecture

### Step 1: Map Concepts to Patterns

For each concept, work out what it **DOES**, its relationships, and the core flow — that determines what someone needs to **SEE**, and which visual pattern shows it.

Read `references/visual-patterns.md` for the concept-to-pattern mapping table and full pattern library (fan-out, convergence, tree, timeline, spiral, cloud, assembly line, side-by-side, gap/break).

Each major concept must use a **different** visual pattern. No uniform cards or grids.

### Step 2: Generate JSON

Read `references/design-rules.md` for container discipline, color rules, aesthetics, layout, text rules, and JSON structure.

- `references/element-templates.md` — copy-paste JSON templates per element type
- `references/color-palette.md` — semantic color assignments
- `references/json-schema.md` — full JSON schema reference

For large/comprehensive diagrams → read `references/large-diagram-strategy.md` (build one section at a time, never generate entire diagram in one pass).

Read `references/output-format.md` for output path rules, filename convention, and artifact structure.

### Step 3: Render & Validate (MANDATORY)

Read `references/render-validate.md` for the full render-view-fix loop.

### Step 4: Final Quality Check

Read `references/quality-checklist.md` and verify all 23 items (item 16 is
`render_excalidraw.py`'s own `[OK]/[FAIL] quality N/N` output — run it, don't
eyeball it), then emit a deterministic verdict:

```
[OK] visuals:excalidraw-diagram
  Topic:      <topic-or-spec>
  File:       <path/to/diagram.excalidraw>
  PNG:        <path/to/diagram.png>
  Quality:    23/23 items passed
  Iterations: <render-fix loops>
  Next:       open <png-path> 또는 share <excalidraw-path>
```

실패 시:

```
[FAIL] visuals:excalidraw-diagram
  Step:    <Step 0~4 where it failed>
  Detail:  <topic too vague | renderer missing | quality items failed>
```
