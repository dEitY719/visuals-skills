# Visualize Self-Improvement Loop — Agent Prompt

> Pass this entire file as a prompt to any Claude agent (Claude Code, OpenClaw, etc.)
> to run one complete improvement round.
> The agent needs: shell access, file system access, and git push access to the repo.

---

You are running one round of the Visualize plugin's self-improvement loop. Follow these steps exactly.

## Step 0: Setup

```bash
# 1. Create a working directory
WORK_DIR=$(mktemp -d)
cd "$WORK_DIR"

# 2. Clone the repo
git clone https://github.com/careerhackeralex/visualize.git
cd visualize

# 3. Read current state
cat eval/loop-state.json
```

**Check gate:** If `gate` is `VIRAL`, report the status and STOP — no improvement needed. If `gate` is `SHIP`, continue running — the goal is now VIRAL (≥9.5, all ≥9).

**Check plateau:** If `loopsSinceResearch >= 5` AND the last 3 rounds improved less than 0.3 total, switch to **Research Mode** (see bottom of this prompt).

**Determine round number:** `currentRound + 1` from loop-state.json.

## Step 1: Generate — Persona-Driven Random Prompts

Create a random persona. Be specific and realistic:

1. **Role** — e.g., "Head of Product at a Series B fintech startup"
2. **Situation** — e.g., "presenting Q4 results to the board next Tuesday"
3. **Skill level** — e.g., "technical enough to read a chart, but wants beautiful output without fiddling"

From this persona, generate **3 natural-language prompts** they would realistically type:
- At least 1 must require data visualization (charts/graphs)
- Prompts should be conversational, not formulaic
- Each should result in a different visualization type

**Constraints on persona selection:**
- Check `eval/loop-state.json` → `lastPersona` field
- Do NOT repeat a similar persona archetype from the last 3 rounds
- Vary industry, role, and technical sophistication

**Save persona to:** `eval/rounds/round-{N}/persona.md`

**Generate each output:**
```bash
mkdir -p eval/rounds/round-{N}/generated
cd eval/rounds/round-{N}/generated

# For each of the 3 prompts:
claude -p --dangerously-skip-permissions --model sonnet \
  "PROMPT_TEXT_HERE. Save as descriptive-name.html"
```

Each prompt should instruct Claude to save the file with a descriptive kebab-case name.
The generated HTML files end up in `eval/rounds/round-{N}/generated/`.

## Step 2: Evaluate — 3-Layer Pipeline

### Layer 1 & 2 (automated)

```bash
cd eval/pipeline

# Install dependencies if needed
npm install

# Run the automated pipeline (Layer 1 format detection + Layer 2 DOM checks)
node run.js --dir ../rounds/round-{N}/generated/ --round {N}
```

This automatically:
1. **Layer 1:** Detects format from DOM (slide-deck, dashboard, infographic, etc.)
2. **Layer 2:** Runs 45 deterministic DOM checks (theme, menu, typography, layout, accessibility, charts, technical)
3. **Screenshots:** Captures dark/light/mobile views for your Layer 3 review

Results saved to `eval/rounds/round-{N}/scores.json`.

### Layer 3 (you do this)

Now look at the screenshots in `eval/rounds/round-{N}/screenshots/`. For EACH generated file, evaluate visually using these calibrated dimensions:

- **D1. First Impression (15%)** — Would you screenshot this? Does it feel premium?
- **D2. Typography (15%)** — Clear hierarchy? Professional sizing/spacing?
- **D3. Color (10%)** — Harmonious palette? Both themes look intentional?
- **D4. Layout (15%)** — Good rhythm? Generous whitespace? Responsive?
- **D5. Content (15%)** — Clear message? Real data? No filler?
- **D6. Information Architecture (20%)** — Key message in 5 seconds? Logical flow?
- **D7. Format Execution (10%)** — Does the format serve the content well?

**Calibration anchors (do not deviate):**
- 10 = Apple keynote / Stripe dashboard
- 9 = Linear, Vercel, Raycast
- 8 = Polished SaaS product
- 7 = Good Bootstrap template
- 6 = Amateur but functional
- 5 = Multiple visible problems

Score each dimension 1-10. Calculate weighted overall: `sum(score × weight)`.

**Review all results.** For each file, note:
- Layer 2 failed checks (deterministic — each is a clear rule violation)
- Layer 3 dimension scores (which dimensions scored lowest?)
- Console errors (bugs in the generated code)

## Step 3: Analyze — Root Cause in SKILL.md

For EVERY issue found in Step 2, trace it back to the skill instructions:

Read these files:
- `skills/visualize/SKILL.md`
- `skills/visualize/references/skeleton.md`
- `skills/visualize/references/design-system.md`
- Other references as needed

For each issue, determine:

| Category | Meaning | Example |
|----------|---------|---------|
| **Missing** | SKILL.md doesn't mention this at all | No instruction about `prefers-reduced-motion` |
| **Unclear** | Mentioned but ambiguous | "use appropriate spacing" instead of "minimum 48px between sections" |
| **Contradictory** | Two references disagree | animations.md says scale on hover, design-system.md says shadow-only |
| **Buried** | Exists but too deep in references | Critical rule is in paragraph 47 of css-techniques.md |

**Prioritize by:** frequency (affects multiple outputs) × severity (large score impact)

Write your analysis to `eval/rounds/round-{N}/analysis.md` with this structure:

```markdown
# Round {N} Analysis

## Persona
{name, role, situation}

## Scores Summary
| File | L2 | L3 | Overall |
|------|----|----|---------|
| ... | ... | ... | ... |

## Issues Found

### Issue 1: {title}
- **Category:** Missing / Unclear / Contradictory / Buried
- **Frequency:** Affected {N}/{total} outputs
- **Severity:** High / Medium / Low
- **Root cause:** {which instruction in SKILL.md or references}
- **Proposed fix:** {what to change}

### Issue 2: ...
```

## Step 4: Fix — Update Skill Instructions

**Critical: Fix the SKILL, not the outputs.** Individual outputs will improve when the skill instructions improve.

1. Fix `skills/visualize/SKILL.md` first:
   - Add missing instructions (be concrete: "use 48px minimum" not "use appropriate spacing")
   - Clarify vague instructions with examples
   - Resolve contradictions
   - Move buried rules to more prominent positions
   - **SKILL.md must stay under 5,000 words** — move details to references

2. Fix references (priority order):
   - `references/skeleton.md` (affects every output)
   - `references/design-system.md` (affects visual quality)
   - Other references as needed

3. Commit:
```bash
git add -A
git commit -m "eval: round {N} fixes — {one-line summary}"
git push origin main
```

## Step 5: Re-test

1. Re-generate the **worst-scoring output** from Step 1:
```bash
claude -p --dangerously-skip-permissions --model sonnet \
  "ORIGINAL_PROMPT_FOR_WORST_FILE"
```

2. Re-evaluate with the pipeline:
```bash
cd eval/pipeline
node run.js --file path/to/regenerated.html --round {N}-retest
```

3. Compare before/after scores
4. If regression on other dimensions → revert the fix and try a different approach

## Step 6: Finalize

1. Update `eval/loop-state.json`:
```json
{
  "currentRound": {N},
  "loopsSinceResearch": {previous + 1},
  "lastAverage": {new average},
  "gate": "{new gate}",
  "lastPersona": "{brief persona description}",
  "history": [
    ...existing history...,
    { "round": {N}, "avg": {score}, "gate": "{gate}", "notes": "{summary}" }
  ]
}
```

2. Commit and push:
```bash
git add -A
git commit -m "eval: round {N} complete — avg {score}, gate {gate}"
git push origin main
```

## Step 7: Report

Output this summary:

```
═══════════════════════════════════════════
ROUND {N} REPORT
═══════════════════════════════════════════

Persona: {role} — {situation}

Prompts:
1. {prompt 1}
2. {prompt 2}
3. {prompt 3}

Scores:
| File | Format | L2 | L3 | Overall |
|------|--------|----|----|---------|
| ... | ... | ... | ... | ... |

Average: {X.XX}/10 (delta: {+/-X.XX} from last round)
Gate: {GATE}

Top Changes to SKILL.md:
- {change 1}
- {change 2}
- {change 3}

Re-test Results:
  Before: {score} → After: {score}

Commit: {hash}
═══════════════════════════════════════════
```

---

## Research Mode

Only run this instead of the normal loop when triggered (see Step 0).

1. Web search for: "best HTML dashboard design 2026", "modern data visualization CSS", "award-winning infographic design"
2. Study 3-5 reference sites: Stripe Dashboard, Linear App, Vercel Dashboard, Apple product pages
3. For each, extract 2-3 specific techniques that could improve the skill
4. Document in `eval/rounds/round-{N}/research.md`
5. Update SKILL.md and references with actionable techniques
6. Reset `loopsSinceResearch` to 0 in loop-state.json
7. Commit and push
8. Then run a normal improvement round (Steps 1-7)

---

## Quality Gates

| Gate | Overall Avg | Min Score | Action |
|------|-------------|-----------|--------|
| VIRAL | ≥ 9.5 | all ≥ 9 | Stop |
| SHIP | ≥ 9.0 | all ≥ 8 | Stop |
| ACCEPTABLE | ≥ 8.0 | all ≥ 7 | Continue |
| NEEDS WORK | ≥ 7.0 | any < 7 | Continue |
| FAIL | < 7.0 | any < 5 | Major rework |

## Invariants (NEVER violate)

1. Git repo always in working state after each commit
2. SKILL.md under 5,000 words
3. All top-level JS in skeleton/examples uses `var` (not let/const)
4. Class-based theming only (no @media prefers-color-scheme for CSS vars)
5. Content visible by default (no JS-hidden content)
6. Every fix goes into SKILL.md or references — never just individual outputs
7. Plugin structure valid (.claude-plugin/plugin.json + skills/visualize/)
