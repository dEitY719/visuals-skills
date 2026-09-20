# Pre-Flight Checklist — Verify before outputting any visualization

Run the shared verifier first, and fix every `[FAIL]` it reports:

```sh
bash "${CLAUDE_PLUGIN_ROOT}/lib/verify-html.sh" --profile viz <output>.html
```

It codes the mechanical items and prints its own labels. What it cannot see —
rendered geometry (375px overflow, minimum sizes), behaviour (hover, meaningful
interaction, console errors), delivery, and content judgement — is why the rest
of this list stays. Run through every item before delivering the HTML file.

## Theme & CSS

- [ ] JS detects OS preference on first visit, stores in `localStorage`?
- [ ] All text uses `var(--text)` or `var(--text-secondary)`?
- [ ] Hero/title text visible on BOTH dark (`#030712`) and light (`#f8fafc`) backgrounds?
- [ ] Correct font loaded? (Inter default, Noto Sans KR for Korean content, etc.)
- [ ] Non-Latin content has appropriate CJK/RTL font?

## Layout & Responsiveness

- [ ] No horizontal overflow at 375px viewport width?
- [ ] `@media print` hides menu, shows all content?
- [ ] Minimum sizing rules followed — cards ≥280px, body text ≥16px, sections ≥48px spacing? (see [sizing-rules.md](sizing-rules.md))

## Menu & Interactions

- [ ] `.viz-menu` with toggle, theme, download PNG, print buttons present?
- [ ] `.card:hover` has a visible hover effect with NO transform (no `translateY`/`scale`)?
      A shadow is required; a `border-color` accent alongside it is allowed.
- [ ] At least ONE meaningful interaction beyond theme toggle + menu?

## Animations

- [ ] Entrance animations via `.animate` classes (CSS @keyframes)?
- [ ] Scroll sections use `data-reveal` (content visible without JS)?
- [ ] Animated number counters use `data-count` where stats exist?

## JavaScript

- [ ] `cycleTheme()` function exists and changes html class?
- [ ] `toggleMenu()` function exists and closes on outside clicks?

## Charts (if using Chart.js)

- [ ] Charts use `var` declarations + `onThemeChange` hook?
- [ ] All charts wrapped with `role="img" aria-label="..."`?
- [ ] All charts have hover tooltips enabled (never disabled)?
- [ ] All charts have explicit container sizing (≥300px height)?
- [ ] `Chart.defaults.animation = false;` set immediately after CDN?
- [ ] Zero console errors on load?

## Semantic HTML

- [ ] `<main>`, `<section>`, `<header>`, `<article>` used correctly?
- [ ] Skip-to-content link or landmark roles present?

## Output Delivery (Bedrock-safe)

- [ ] Every rule in [bedrock-safe-write.md](bedrock-safe-write.md) § Hard Rules met? (That file is the owner; do not restate its rules here.)

---

## Anti-Patterns to Avoid

- [FAIL] Walls of text — if it reads like a document, it's not a visualization
- [FAIL] Tiny fonts — minimum 1rem (16px) body, 20px+ for presentation headings
- [FAIL] Rainbow colors — stick to 2-3 colors from the palette + neutrals
- [FAIL] Placeholder content — never use "Lorem ipsum" or fake data when real context exists
- [FAIL] Over-engineering — simplest approach that looks stunning
- [FAIL] Cramped layouts — when in doubt, add more whitespace
- [FAIL] Generic design — each visualization should feel intentional, not templated
- [FAIL] Missing menu — every output needs the hamburger menu
- [FAIL] Broken print — always include `@media print` styles
- [FAIL] Static feeling — every file needs at least ONE meaningful interaction
