# Evaluation System — 3-Layer Scoring

## Overview

The eval pipeline scores HTML visualizations through 3 independent layers:

1. **Layer 1: Format Appropriateness** (Pass/Fail Gate)
2. **Layer 2: Structural Quality** (0-100, deterministic DOM checks)
3. **Layer 3: Visual & Information Architecture Quality** (1-10, vision model)

## Layer 1: Format Appropriateness (Pass/Fail)

Given the original prompt, does the chosen format make sense?

- **Detect**: Playwright inspects the DOM to classify format (slide deck, carousel, poster, dashboard, infographic, timeline, etc.)
- **Judge**: LLM evaluates if the detected format fits the prompt
- **Validate**: Format-specific structural checks

If format is wrong for the prompt → score is 0, skip remaining layers.

### Format-Specific Checks

| Format | Required Checks |
|--------|----------------|
| Slide Deck | 16:9 viewport, slides fill screen, keyboard nav, slide counter, progress bar |
| Carousel | 1080×1080 per card, swipe+arrow+keyboard nav, card counter |
| Poster (9:16) | 1080×1920, overflow:hidden, no scroll |
| Square (1:1) | 1080×1080, overflow:hidden |
| Dashboard | Scrollable, CSS grid, KPI cards, ≥1 chart, filter/interaction |
| Infographic | Long-scroll, multiple sections, data-reveal, big stats |
| Timeline | Chronological markers, alternating/vertical layout |

## Layer 2: Structural Quality (0-100)

Playwright DOM audit with 30+ automated checks across 7 categories:

### Categories
- **Theme & Styling** (20 pts) — dark/light classes, CSS vars, toggle works, Inter font
- **Menu** (15 pts) — menu exists, toggle/theme/download/print buttons, opens/closes
- **Typography** (15 pts) — font hierarchy, min sizes, letter-spacing, weight hierarchy
- **Layout** (15 pts) — no overflow at 3 widths, flex/grid, spacing, padding
- **Accessibility** (15 pts) — semantic HTML, print styles, reduced-motion, aria-labels
- **Charts** (10 pts) — animation disabled, tooltips, sizing, aspect ratio, theme colors
- **Technical** (10 pts) — zero errors, var usage, file size, no external images, animations

Each check: pass = full weight, fail = 0. Normalized to 0-100.

## Layer 3: Visual & IA Quality (1-10)

Claude vision model scores screenshots against calibration anchors.

### Screenshots Captured
- Dark theme at 1440px
- Light theme at 1440px
- Dark theme at 375px (mobile)
- Slide decks: slides 1, 3, and last

### Dimensions (weighted)
- D1. First Impression (15%) — Would you screenshot this?
- D2. Typography (15%) — Clear hierarchy? Professional?
- D3. Color (10%) — Harmonious? Both themes intentional?
- D4. Layout (15%) — Good rhythm? Generous whitespace?
- D5. Content (15%) — Clear message? Real data?
- D6. Information Architecture (20%) — Logical flow? Key message in 5 seconds?

### Calibration Anchors
- 10 = Apple keynote / Stripe dashboard
- 9 = Linear, Vercel, Raycast
- 8 = Polished SaaS product
- 7 = Good Bootstrap template
- 6 = Amateur but functional
- 5 = Multiple visible problems

## Overall Score

```
overall = (layer2_normalized / 10) * 0.4 + layer3_score * 0.6
```

Layer 2 is 40% (structural compliance), Layer 3 is 60% (visual/IA quality).

## Quality Gates

| Gate | Overall Avg | Min Score | Action |
|------|-------------|-----------|--------|
| VIRAL | ≥ 9.5 | all ≥ 9 | Stop. Screenshot-worthy. |
| SHIP | ≥ 9.0 | all ≥ 8 | Stop. Production-ready. |
| ACCEPTABLE | ≥ 8.0 | all ≥ 7 | Continue iterating. |
| NEEDS WORK | ≥ 7.0 | any < 7 | Continue, prioritize weak areas. |
| FAIL | < 7.0 | any < 5 | Major rework needed. |
