# Calibration Anchors

Fixed reference points for Layer 3 vision evaluation. These anchors NEVER change between rounds — they prevent evaluator drift.

## Anchor: Score 9 (External Reference)

**Source:** Stripe Dashboard / Linear App UI
**Why 9:** Clean typography hierarchy, generous whitespace, deliberate color palette, information density without clutter, every pixel feels intentional.

Screenshot: `anchor-9.png` (to be captured from a reference site)

## Anchor: Score 7 (Internal Reference)

**Source:** Best current example output from the visualize skill
**Why 7:** Solid implementation, correct structure, but lacks the refined polish of professional design tools. Slight issues with spacing consistency, color harmony, or information hierarchy.

Screenshot: `anchor-7.png` (to be captured from best example)

## How Anchors Are Used

The vision evaluation prompt includes these anchors as calibration:
- "This is what a 9 looks like" → sets the ceiling for AI-generated content
- "This is what a 7 looks like" → sets the baseline for "good enough"
- Evaluator must score relative to these fixed points

## Updating Anchors

Anchors should only be updated when:
1. The anchor screenshots become technically outdated (e.g., reference site redesigns)
2. The team agrees on new reference points
3. Both anchors must be updated simultaneously with full re-calibration

Never update anchors mid-improvement-loop. Only between major version bumps.
