# Visualize Improvement Loop (v6 — Install & Pipeline)

The git repo (`https://github.com/careerhackeralex/visualize`) is the **source of truth**.
Every iteration installs the plugin from GitHub, invokes it through Claude Code, evaluates real output with the automated pipeline, fixes the skill, and pushes improvements back.

## Architecture

```
Loop fires (manual or cron)
  └── Agent starts
        │
        ├── Step 0: Install plugin from GitHub
        ├── Step 1: Check state (skip if SHIP/VIRAL)
        ├── Step 2: Generate — invoke skill via Claude Code CLI
        ├── Step 3: Evaluate — 3-layer pipeline + agent vision scoring
        ├── Step 4: Analyze — root cause, trace to SKILL.md
        ├── Step 5: Uninstall plugin
        ├── Step 6: Clone repo, fix SKILL.md + references
        ├── Step 7: Push fixes to git
        ├── Step 8: Re-install from git (gets updated version)
        ├── Step 9: Re-generate worst prompts to verify fixes
        ├── Step 10: Validate — pipeline re-eval + screenshots
        ├── Step 11: Commit final results & push
        └── Step 12: Cleanup & report
```

## Step 0: Install Plugin from GitHub

```bash
# Add marketplace (if not already added)
claude plugin marketplace add careerhackeralex/visualize

# Install the plugin
claude plugin install visualize@careerhackeralex
```
This is exactly what a real user does. We test what they get.

## Step 1: Check State

```bash
# Clone repo separately just to read state
WORK_DIR=$(mktemp -d)
cd "$WORK_DIR"
git clone https://github.com/careerhackeralex/visualize.git
```
- Read `eval/loop-state.json`
- If gate is SHIP or VIRAL → report status, cleanup, exit
- If `loopsSinceResearch >= 5` AND score plateau → research phase

## Step 2: Generate (The Real Test)

Create a temp output directory and invoke the skill through Claude Code:
```bash
mkdir -p "$WORK_DIR/outputs"
cd "$WORK_DIR/outputs"
```

Create a random persona with:
- Role (e.g., "VP of Sales at a B2B SaaS company")
- Situation (e.g., "preparing quarterly board update")
- Skill level (e.g., "non-technical, wants something impressive fast")

Generate 3-5 prompts they'd realistically type, plus 2-3 fixed prompts from `eval/stress-tests.md`.

For each test prompt:
```bash
claude -p \
  --dangerously-skip-permissions \
  --allow-dangerously-skip-permissions \
  --model sonnet \
  "{test prompt}. Save as {filename}.html"
```

**No `--plugin-dir`.** The skill is installed as a real plugin. Claude Code discovers it automatically, just like a real user.

**Test prompt selection — always include:**
- 1 slide deck / presentation
- 1 dashboard with data
- 1 infographic / visual storytelling
- 1 non-English (Korean, Japanese, etc.)
- 1-2 rotating types (cheatsheet, comparison, flowchart, poster, carousel, timeline, etc.)

Save outputs to `eval/rounds/round-{N}/generated/`.

## Step 3: Evaluate — 3-Layer Pipeline

Run the automated eval pipeline (Layers 1 & 2):
```bash
cd "$WORK_DIR/visualize/eval/pipeline"
node run.js --dir "$WORK_DIR/outputs" --round {N}
```

This runs:
1. **Layer 1**: Format detection from DOM signals
2. **Layer 2**: 45 deterministic DOM checks (0-100 score)
3. **Screenshots**: Dark/light desktop + dark mobile captured

Results saved to `eval/rounds/round-{N}/scores.json`.
Screenshots saved to `eval/rounds/round-{N}/screenshots/`.

Then **you** (the agent) perform **Layer 3**: look at the screenshots and score 7 visual/IA dimensions using the calibrated prompt in `eval/pipeline/LOOP-PROMPT.md`:
1. First Impression (15%)
2. Typography (15%)
3. Color (10%)
4. Layout (15%)
5. Content (15%)
6. Information Architecture (20%)
7. Format Execution (10%)

**Calibration anchors (use these to stay consistent):**
| Score | Benchmark |
|-------|-----------|
| 10 | Apple.com product page |
| 9 | Stripe dashboard, Linear UI |
| 8 | Well-designed SaaS landing page |
| 7 | Decent Bootstrap template |
| 6 | Generic HTML template |
| 5 | Unstyled HTML with some CSS |

## Step 4: Analyze

Don't jump to fixes. Think first:
1. **Weakest dimensions** across all outputs (Layer 2 failing checks + Layer 3 low scores)
2. **Worst outputs** — which prompts produced bad results?
3. **Skill compliance** — did Claude Code actually follow SKILL.md? If not, WHY?
4. **Root cause** — trace every issue to a specific SKILL.md instruction (missing, unclear, wrong, buried, contradictory)
5. **Tag each fix:** `SKILL` / `REF:skeleton` / `REF:design-system` / `REF:other`

Write analysis to `eval/rounds/round-{N}/analysis.md`.

## Step 5: Uninstall Plugin

```bash
claude plugin uninstall visualize@careerhackeralex
```
Clean slate before we make fixes.

## Step 6: Fix SKILL.md + References

Work in the cloned repo from Step 1 (`$WORK_DIR/visualize`).

**SKILL.md (most important):**
- Add missing instructions with concrete examples
- Clarify vague instructions ("use 2rem" not "use appropriate sizing")
- Add anti-patterns ("DON'T: gradient text on headings")
- Simplify verbose instructions
- Make ignored instructions more prominent ("CRITICAL:" prefix)
- Keep under **5,000 words**

**References (priority order):**
1. `skeleton.md` — the HTML template, affects every output
2. `design-system.md` — typography, colors, spacing
3. `types.md`, `menu.md`, `libraries.md`, `css-techniques.md`

**Simplify everything:**
- Remove unused CSS rules
- Consolidate duplicates
- Replace JS with CSS where possible
- All top-level JS uses `var`

## Step 7: Push Fixes to Git

```bash
cd "$WORK_DIR/visualize"
git add -A
git commit -m "eval: round {N} fixes — {summary of SKILL.md changes}"
git push origin main
```

## Step 8: Re-install from Git

```bash
# Update marketplace to get latest
claude plugin marketplace update careerhackeralex

# Re-install (gets the fixed version)
claude plugin install visualize@careerhackeralex
```
Now the installed plugin has our fixes.

## Step 9: Re-generate (Verify Fixes)

Re-run the **worst 2-3 prompts** from Step 2:
```bash
cd "$WORK_DIR/outputs-fixed"
claude -p \
  --dangerously-skip-permissions \
  --allow-dangerously-skip-permissions \
  --model sonnet \
  "{same prompt}. Save as {filename}.html"
```
Compare before/after. Fixes should produce noticeably better output.

## Step 10: Validate

Run the pipeline again on re-generated files:
```bash
cd "$WORK_DIR/visualize/eval/pipeline"
node run.js --dir "$WORK_DIR/outputs-fixed" --round {N}
```

Verify:
- Layer 2 score improved
- Zero console errors
- Both dark and light themes work
- Hamburger menu works (toggle, download, print)
- If regression → revert, try different approach

Save post-fix screenshots to `eval/rounds/round-{N}/screenshots/`.

## Step 11: Commit Final Results & Push

Copy good re-generated outputs to `skills/visualize/examples/` if they're better than existing ones:
```bash
cd "$WORK_DIR/visualize"
cp "$WORK_DIR/outputs-fixed/"*.html skills/visualize/examples/
git add -A
git commit -m "eval: round {N} — avg {score} ({delta}), gate {GATE}

Key SKILL.md changes:
- {change 1}
- {change 2}

Generated via: claude -p (installed plugin, sonnet)
Weakest: {dim} ({score}), Strongest: {dim} ({score})"
git push origin main
```

Update `eval/loop-state.json` in this commit.

## Step 12: Cleanup & Report

```bash
# Uninstall plugin
claude plugin uninstall visualize@careerhackeralex
claude plugin marketplace remove careerhackeralex

# Delete temp directory
rm -rf "$WORK_DIR"
```

Output summary:
- Round number, persona, prompts
- Per-file scores (Layer 2 + Layer 3)
- Average score and delta from last round
- Top SKILL.md changes made
- Before/after for worst file
- Gate status
- Git commit hash

## Research Phase

Triggered when: `loopsSinceResearch >= 5` AND score plateau (< 0.3 improvement over 3 rounds).

1. Web search latest CSS/visualization techniques
2. Study award-winning designs (Stripe, Linear, Apple)
3. Analyze Gamma/Canva — what makes their output look professional?
4. Document in `eval/rounds/round-{N}/research.md`
5. Update SKILL.md + references
6. Reset `loopsSinceResearch = 0`
7. 30 minutes max, no rabbit holes

## Quality Gates

| Gate | Avg | Min | Meaning |
|------|-----|-----|---------|
| VIRAL | ≥ 9.5 | all ≥ 9 | Screenshot-worthy |
| SHIP | ≥ 9.0 | all ≥ 8 | Ready for public |
| ACCEPTABLE | ≥ 8.0 | all ≥ 7 | Functional, decent |
| NEEDS WORK | ≥ 7.0 | or any < 7 | Keep iterating |
| FAIL | < 7.0 | or any < 5 | Significant issues |

## Invariants (Never Break These)

1. Git repo always in working state
2. SKILL.md under 5,000 words
3. All top-level JS uses `var`
4. Class-based theming only (no @media prefers-color-scheme)
5. Content visible by default
6. Every fix goes into SKILL.md or references, not just individual files
7. Plugin structure valid (`.claude-plugin/plugin.json` + `skills/visualize/`)
8. **All evaluated outputs generated by invoking the installed skill, never hand-crafted**
9. **Plugin installed from GitHub, not local path**
