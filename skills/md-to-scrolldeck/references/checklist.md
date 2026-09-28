# Pre-Flight Checklist — verify before reporting the deck done

Every mechanical item below is coded in the shared verifier — run it first,
and fix every `[FAIL]` before reading further:

```sh
if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ]; then _skill="$CLAUDE_PLUGIN_ROOT/skills/md-to-scrolldeck"; else _skill="${HERMES_SKILL_DIR}"; fi
if [ -n "$_skill" ] && [ -f "$_skill/lib/vendor/verify-html.sh" ]; then
  bash "$_skill/lib/vendor/verify-html.sh" --profile deck <output>.html
else
  printf '[FAIL] skill dir unresolved — export CLAUDE_PLUGIN_ROOT=<plugin dir> or HERMES_SKILL_DIR=<skill dir>\n' >&2; false
fi
```

It prints its own labels, and it covers the two cross-checks a plain `grep`
cannot do: every dot `href` resolving to a real slide id in slide order, and
each `.next-cue` pointing at the *next* slide rather than any slide. Getting
the cue chain off by one is the most common wiring bug and it is the one
thing a count-only pass will always call `[OK]`.

The remaining items need a human. Verify them by inspection of the file, not
from memory.

## Curation

- [ ] The nav-dot outline was produced and shown to the user **before** any
      HTML was written?
- [ ] Slide count is between 5 and 20, and matches the outline?
- [ ] Slides are narrative beats, not a 1:1 copy of the source headings?
- [ ] Reference lists / link dumps / appendices were cut, and the cuts were
      reported?
- [ ] Every slide traces to a source line range — nothing invented?
- [ ] Reading the headlines in order tells a coherent story?
- [ ] One idea per slide, headline <= ~10 words, body <= ~40 words?
- [ ] Slide variants alternate — no three consecutive identical treatments?

## Scroll chrome

- [ ] `scroll-snap-type: y mandatory` on `html`, and
      `scroll-snap-align: start` + `scroll-snap-stop: always` on `.slide`?
- [ ] `.progress__bar` present and wired — `updateProgress()` sets its
      `scaleX` from scroll position, on `scroll` and `resize`?
- [ ] `.deck-header` counter reads `01 / NN` with the real slide count, and
      `data-phase` on every slide feeds `.deck-header__phase`?
- [ ] `IntersectionObserver` sets the active slide and moves
      `aria-current="step"` across the dots?
- [ ] `ArrowDown` / `ArrowUp` (plus PageDown/PageUp/Home/End/Space) call
      `goTo()`, and `goTo()` uses `scrollIntoView` with
      `behavior: reduceMotion ? "auto" : "smooth"`?

## Accessibility and resilience

- [ ] `@media (prefers-reduced-motion: reduce)` present, disabling
      `scroll-behavior`, animations, and the `.reveal` transform?
- [ ] Content is visible without JS — `.reveal` hiding is scoped to `.js`,
      and a `<noscript>` note is present?
- [ ] Every `<section class="slide">` has `aria-labelledby` matching its own
      heading id, and every dot has a descriptive `aria-label`?
- [ ] `<html lang>` matches the source document's language, and Korean text
      keeps `word-break: keep-all`?
- [ ] No horizontal overflow at 375px; snap is disabled under 767px?

## Print

- [ ] `@media print` turns scroll-snap **off** (`scroll-snap-type: none`)?
- [ ] Print hides `.progress`, `.deck-header`, `.deck-nav`, `.next-cue`?
- [ ] Every slide breaks onto its own page
      (`break-after: page` / `page-break-after: always`) so all slides
      stack instead of only the first one printing?
- [ ] `.reveal` forced visible in print?
- [ ] Dark slides set `print-color-adjust: exact`?

## Explicitly out of scope (fail if present)

This format deliberately diverges from `visuals:visualize`. Do not "fix" these
back by copying that skill's skeleton — the omissions are intentional.

- [ ] **No** `.viz-menu` hamburger, no `toggleMenu()`?
- [ ] **No** theme toggle / `cycleTheme()` / `.theme-dark` / `.theme-light`
      classes — this deck is a single designed light-paper theme with dark
      slide variants used as *editorial* contrast, not as a user setting?
- [ ] **No** PNG export, no `html-to-image` CDN script?
- [ ] **No** base64 `@font-face` data URI, unless the user explicitly asked
      for offline operation and was warned (see
      `font-and-bedrock-safety.md`)?

## Delivery

- [ ] Every rule in [font-and-bedrock-safety.md](font-and-bedrock-safety.md)
      § 2 met? (That file is the owner; do not restate its rules here.)
- [ ] Output path is the input's directory + basename with `.html`, unless
      the user specified a path?
