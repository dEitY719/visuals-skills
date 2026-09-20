#!/usr/bin/env bash
# Shared post-write verifier for the visualize and md-to-scrolldeck skills.
# Encodes the machine-checkable items of their pre-flight checklists; the
# judgement calls (curation, typography, delivery hygiene) stay with the human.
#
#   bash lib/verify-html.sh --profile viz  <file.html>
#   bash lib/verify-html.sh --profile deck <file.html>
#
# Exit 0 = every item OK, 1 = at least one item failed, 2 = usage/file error.
set -euo pipefail

usage() {
  printf 'usage: verify-html.sh --profile viz|deck <file.html>\n' >&2
  printf '       verify-html.sh --selftest\n' >&2
  exit 2
}

# --selftest: regression cases for the checks that have actually been wrong.
# No framework on purpose - this repo ships no test runner. Cases 2 and 3 are
# the PR #24 review finding: a bare "prefers-color-scheme" substring search
# failed every skeleton-derived file, because the required JS first-visit
# detection spells it window.matchMedia('(prefers-color-scheme: light)').
selftest() {
  local self root tmp fails=0
  self="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
  root="$(cd "$(dirname "$self")/.." && pwd)"
  tmp="$(mktemp -d)"
  # shellcheck disable=SC2064  # expand tmp now, not at trap time
  trap "rm -rf '$tmp'" EXIT

  expect_line() { # <label> <profile> <file> <expected substring>
    # Capture first: under `set -o pipefail` a failing checker run would make
    # the pipeline non-zero even when grep matched.
    local out
    out=$(bash "$self" --profile "$2" "$3" 2>&1 || true)
    if printf '%s\n' "$out" | grep -qF -- "$4"; then
      printf '[OK] selftest: %s\n' "$1"
    else
      printf '[FAIL] selftest: %s -- expected output line: %s\n' "$1" "$4"
      fails=$((fails + 1))
    fi
  }
  expect_status() { # <label> <expected rc> <args...>
    local label="$1" want="$2" got=0
    shift 2
    bash "$self" "$@" >/dev/null 2>&1 || got=$?
    if [ "$got" -eq "$want" ]; then
      printf '[OK] selftest: %s\n' "$label"
    else
      printf '[FAIL] selftest: %s -- exit %d, expected %d\n' "$label" "$got" "$want"
      fails=$((fails + 1))
    fi
  }

  # 1. the committed deck fixture is correctly wired end to end
  if [ -r "$root/docs/skill-output/md-to-scrolldeck-deck.html" ]; then
    expect_status "deck fixture passes" 0 \
      --profile deck "$root/docs/skill-output/md-to-scrolldeck-deck.html"
    # 5. and the cue chain check actually catches an off-by-one
    sed 's|class="next-cue" href="#pick-rule"|class="next-cue" href="#install"|' \
      "$root/docs/skill-output/md-to-scrolldeck-deck.html" >"$tmp/bad-deck.html"
    expect_line "cue chain off-by-one caught" deck "$tmp/bad-deck.html" \
      "[FAIL] next-cue chain"
  fi

  # 2. REGRESSION: the required JS OS-preference detection must NOT trip the
  #    class-based-theming check.
  cat >"$tmp/js-theme.html" <<'HTML'
<html class="theme-dark"><body><main id="main-content">x</main>
<style>.theme-light{color:#000}</style>
<script>var t = window.matchMedia('(prefers-color-scheme: light)').matches;</script>
</body></html>
HTML
  expect_line "JS matchMedia allowed" viz "$tmp/js-theme.html" \
    "[OK] no @media prefers-color-scheme"

  # 3. a real CSS media query still fails
  cat >"$tmp/css-theme.html" <<'HTML'
<html class="theme-dark"><body><main id="main-content">x</main>
<style>.theme-light{color:#000}
@media (prefers-color-scheme: dark){:root{--bg:#000}}</style>
</body></html>
HTML
  expect_line "CSS @media prefers-color-scheme rejected" viz "$tmp/css-theme.html" \
    "[FAIL] no @media prefers-color-scheme"

  # 4. the id alone must not satisfy the <main> landmark
  cat >"$tmp/no-main.html" <<'HTML'
<html class="theme-dark"><body><a href="#main-content">skip</a>
<div id="main-content">x</div><style>.theme-light{color:#000}</style></body></html>
HTML
  expect_line "skip-link target is not a landmark" viz "$tmp/no-main.html" \
    '[FAIL] <main id="main-content">'

  # 6. usage errors
  expect_status "bad profile exits 2" 2 --profile bogus "$tmp/js-theme.html"
  expect_status "missing file exits 2" 2 --profile viz "$tmp/nope.html"

  # 7. REGRESSION: `display: revert` in @media print does not hide the menu.
  #    Both fixtures carry a screen-side `.viz-menu-dropdown { display: none }`
  #    so a prefix match on the class name cannot satisfy the check either.
  cat >"$tmp/print-revert.html" <<'HTML'
<html class="theme-dark"><body><main id="main-content">x</main>
<style>.theme-light{color:#000} .viz-menu-dropdown { display: none; }
@media print { .viz-menu, .reveal { display: revert; } }</style>
</body></html>
HTML
  expect_line "print display:revert rejected" viz "$tmp/print-revert.html" \
    "[FAIL] print hides .viz-menu"
  cat >"$tmp/print-none.html" <<'HTML'
<html class="theme-dark"><body><main id="main-content">x</main>
<style>.theme-light{color:#000} .viz-menu-dropdown { display: none; }
@media print { .viz-menu, .skip-to-content { display: none !important; } }</style>
</body></html>
HTML
  expect_line "print display:none accepted" viz "$tmp/print-none.html" \
    "[OK] print hides .viz-menu"

  # 8. REGRESSION: the skeleton shipped a second, outer <main id="main-content">.
  #    The landmark check above is satisfied by either one, so only a count
  #    catches it.
  cat >"$tmp/two-mains.html" <<'HTML'
<html class="theme-dark"><body><main id="main-content">
<main id="main-content" role="main">x</main></main>
<style>.theme-light{color:#000}</style></body></html>
HTML
  expect_line "duplicate <main> caught" viz "$tmp/two-mains.html" \
    "[FAIL] exactly one <main>"

  # 9. REGRESSION: #18's one-line grep missed a .card:hover written across
  #    several lines, so excalidraw-diagram.html and visualize-usage.html
  #    falsely passed. The rule below is deliberately multi-line.
  cat >"$tmp/card-transform.html" <<'HTML'
<html class="theme-dark"><body><main id="main-content">x</main>
<style>.theme-light{color:#000}
.card:hover {
  box-shadow: 0 8px 16px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}</style></body></html>
HTML
  expect_line "multi-line .card:hover transform caught" viz "$tmp/card-transform.html" \
    "[FAIL] .card:hover has no transform"

  # 10. and an unrelated class that merely ENDS in -card must not be read as
  #     .card - docs/skill-output/excalidraw-diagram-usage.html ships exactly
  #     this and is correct.
  cat >"$tmp/sibling-card.html" <<'HTML'
<html class="theme-dark"><body><main id="main-content">x</main>
<style>.theme-light{color:#000}
.swatch-card:hover { transform: translateY(-3px); }
.card:hover { box-shadow: 0 8px 16px rgba(0,0,0,0.08); }</style></body></html>
HTML
  expect_line "sibling -card:hover transform allowed" viz "$tmp/sibling-card.html" \
    "[OK] .card:hover has no transform"

  if [ "$fails" -eq 0 ]; then
    printf '[OK] verify-html selftest: all cases passed\n'
    exit 0
  fi
  printf '[FAIL] verify-html selftest: %d case(s) failed\n' "$fails"
  exit 1
}

PROFILE=""
FILE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --profile) [ $# -ge 2 ] || usage; PROFILE="$2"; shift 2 ;;
    --selftest) selftest ;;  # never returns
    -*) usage ;;
    *) [ -z "$FILE" ] || usage; FILE="$1"; shift ;;
  esac
done

case "$PROFILE" in viz|deck) ;; *) usage ;; esac
[ -n "$FILE" ] || usage
if [ ! -f "$FILE" ] || [ ! -r "$FILE" ]; then
  printf 'verify-html.sh: cannot read file: %s\n' "$FILE" >&2
  exit 2
fi

PASSED=0
FAILED=0
ok()  { printf '[OK] %s\n' "$1"; PASSED=$((PASSED + 1)); }
bad() { printf '[FAIL] %s: %s\n' "$1" "$2"; FAILED=$((FAILED + 1)); }

# grep -c exits 1 when the count is 0, which set -e would treat as fatal.
count_lines() { grep -cF -- "$1" "$FILE" || true; }
count_lines_re() { grep -cE -- "$1" "$FILE" || true; }
# -o counts occurrences rather than lines; grep -c cannot do that.
count_hits() {
  local n
  n=$(grep -oF -- "$1" "$FILE" | wc -l | tr -d '[:space:]' || true)
  printf '%s\n' "${n:-0}"
}
# One tag per line: a formatted file wraps a tag's attributes across several
# lines, so ids and hrefs must be read from the tag, not from a line.
flatten_tags() { tr '\n' ' ' <"$FILE" | sed 's/</\n</g'; }
# One CSS rule per line: `selectors {  declarations`. A rule is routinely
# written across several lines, and a per-line grep then reads the selector
# and the declarations as unrelated text - that is how #18's reproducer let
# two multi-line `.card:hover` rules through. Splitting on `}` instead of on
# the newline keeps each selector glued to the block it opens.
flatten_rules() { tr '\n' ' ' <"$FILE" | tr '}' '\n'; }
# The first `@media print` at-rule's body, brace-counted so that a nested
# rule's own `}` cannot end it early. A whole-file grep cannot answer "does
# PRINT hide this", only "is it hidden somewhere".
print_block() {
  tr '\n' ' ' <"$FILE" | awk '
    { i = index($0, "@media print"); if (!i) exit
      s = substr($0, i); d = 0
      for (j = 1; j <= length(s); j++) {
        c = substr(s, j, 1)
        if (c == "{") d++
        else if (c == "}" && --d == 0) break
        printf "%s", c
      }
      print "" }'
}
# present <label> <fixed-string>
present() { if grep -qF -- "$2" "$FILE"; then ok "$1"; else bad "$1" "'$2' not found"; fi; }
# count_eq <label> <fixed-string> <expected-lines> <why-that-many>
count_eq() {
  local got
  got=$(count_lines "$2")
  if [ "$got" -eq "$3" ]; then ok "$1 ($got)"; else bad "$1" "$got, expected $3 ($4)"; fi
}

check_viz() {
  local miss n p hits canvases imgroles

  miss=""
  for p in theme-dark theme-light; do
    grep -qF -- "$p" "$FILE" || miss="$miss $p"
  done
  if [ -z "$miss" ]; then
    ok "theme classes"
  else
    bad "theme classes" "missing:$miss"
  fi

  # Theming is class-based only; a CSS media query defeats the manual toggle.
  # Scoped to the at-rule: the JS first-visit detection
  # window.matchMedia('(prefers-color-scheme: light)') is REQUIRED by
  # checklist.md and must not trip this. See selftest cases 2 and 3.
  # Requiring the opening brace keeps prose and comments that merely NAME the
  # at-rule from failing - skeleton.md's own "class-based ONLY - no @media
  # prefers-color-scheme" comment is the case that forced this.
  n=$(count_lines_re '@media[^{]*prefers-color-scheme[^{]*\{')
  if [ "$n" -eq 0 ]; then
    ok "no @media prefers-color-scheme"
  else
    bad "no @media prefers-color-scheme" \
      "$n CSS media quer(y|ies) theme by OS; theming must be class-based"
  fi

  present "viz-menu" '.viz-menu'
  present "cycleTheme()" 'cycleTheme('
  present "toggleMenu()" 'toggleMenu('
  present "downloadImage()" 'downloadImage('
  present "@media print" '@media print'
  # `display: revert` restores the UA default, it does not hide - the skeleton
  # shipped exactly that and printed the hamburger onto the page.
  if print_block | tr '}' '\n' |
     grep -qE '(^|[^-[:alnum:]_])\.viz-menu([^-[:alnum:]_{][^{]*)?\{[^{]*display:[[:space:]]*none'; then
    ok "print hides .viz-menu"
  else
    bad "print hides .viz-menu" \
      "@media print sets no display: none on .viz-menu; 'display: revert' does not hide it"
  fi
  present "@media (prefers-reduced-motion)" '@media (prefers-reduced-motion'
  # Requiring the <main> tag itself, not just the id, keeps the skip-link
  # target href="#main-content" from satisfying the landmark.
  if flatten_tags | grep -qE '^<main[[:space:]][^>]*id="main-content"'; then
    ok '<main id="main-content">'
  else
    bad '<main id="main-content">' 'no <main> element carrying id="main-content"'
  fi
  # Two <main> elements is invalid HTML on its own; two carrying the same id is
  # a broken skip link as well. The check above is satisfied by either of them,
  # so the count has to be asserted separately.
  n=$(flatten_tags | grep -cE '^<main[[:space:]>]' || true)
  if [ "$n" -eq 1 ]; then
    ok "exactly one <main> (1)"
  else
    bad "exactly one <main>" "$n <main> element(s); a document has exactly one"
  fi

  # checklist.md bans a transform on .card:hover (layout shift on hover); a
  # shadow, and a border-color accent, are both fine. `.swatch-card:hover` and
  # friends are unrelated classes - requiring the literal dot excludes them.
  if flatten_rules | grep -qE '\.card:hover[^{]*\{[^{]*transform[[:space:]]*:'; then
    bad ".card:hover has no transform" \
      "transform in the .card:hover rule; hover is shadow (and border-color), not motion"
  else
    ok ".card:hover has no transform"
  fi

  # Match declarations ("--text:") so --text-secondary: cannot satisfy --text.
  miss=""
  for p in --bg --surface --surface-hover --border --text --text-secondary \
           --accent --accent-secondary --positive --negative --warning; do
    grep -qF -- "$p:" "$FILE" || miss="$miss $p"
  done
  if [ -z "$miss" ]; then
    ok "css custom properties"
  else
    bad "css custom properties" "missing:$miss"
  fi

  # `new Chart(` is what creates a chart. A bare 'Chart' also matches prose and
  # the skeleton's commented-out Chart.js pattern, which then demand a
  # Chart.defaults line from a file that draws nothing.
  if ! grep -qE 'new[[:space:]]+Chart[[:space:]]*\(' "$FILE"; then
    ok "charts: none present (skipped)"
  else
    if grep -qE 'Chart\.defaults\.animation[[:space:]]*=[[:space:]]*false' "$FILE"; then
      ok "charts: animation disabled"
    else
      bad "charts: animation disabled" "'Chart.defaults.animation = false' not found"
    fi
    # ponytail: count heuristic, not an HTML parse - every <canvas> is supposed
    # to sit inside a role="img" wrapper, so fewer role="img" than <canvas>
    # proves at least one chart is unlabelled. Upgrade path is a real parse if
    # a file ever carries role="img" on unrelated elements.
    canvases=$(count_hits '<canvas')
    imgroles=$(count_hits 'role="img"')
    if [ "$imgroles" -ge "$canvases" ]; then
      ok "charts: role=img wrappers"
    else
      bad "charts: role=img wrappers" \
        "$imgroles role=\"img\" vs $canvases <canvas (count heuristic)"
    fi
  fi

  # ponytail: indentation heuristic - a declaration indented 0-4 spaces is
  # treated as top-level. Upgrade path is a real JS parse if it false-positives.
  n=$(count_lines_re '^[[:space:]]{0,4}(let|const)[[:space:]]')
  if [ "$n" -eq 0 ]; then
    ok "no top-level let/const"
  else
    hits=$(grep -nE '^[[:space:]]{0,4}(let|const)[[:space:]]' "$FILE" |
      head -5 | cut -d: -f1 | tr '\n' ' ' || true)
    bad "no top-level let/const" "$n occurrence(s); lines: ${hits% }"
  fi
}

check_deck() {
  local n slides dots cues flat miss tok want got i unresolved cue_ids slide_ids

  # Match on the class attribute, NOT on '<section class="slide' - a formatted
  # file wraps the attributes onto their own lines and that pattern undercounts.
  n=$(count_lines_re 'class="slide[ "]')
  if [ "$n" -ge 1 ]; then
    ok "slide count ($n)"
  else
    bad "slide count" "no elements with class=\"slide\"; every count below is vacuous"
  fi

  count_eq "nav dot count" 'class="deck-nav__dot"' "$n" "one per slide"
  count_eq "aria-labelledby count" 'aria-labelledby=' "$n" "one per slide"

  want=$((n - 1))
  [ "$want" -ge 0 ] || want=0
  count_eq "next-cue count" 'class="next-cue"' "$want" \
    "slides - 1; the last slide has none"

  # These belong to the sibling visualize skill and are deliberately out of
  # scope here - the deck is one designed theme, not a themeable page.
  got=$(count_lines_re 'viz-menu|cycleTheme|toggleMenu|downloadImage|theme-dark')
  if [ "$got" -eq 0 ]; then
    ok "no visualize-skill chrome"
  else
    bad "no visualize-skill chrome" "$got line(s) mention viz-menu/cycleTheme/toggleMenu/downloadImage/theme-dark"
  fi

  got=$(count_lines_re 'url\("data:font|url\(data:font')
  if [ "$got" -eq 0 ]; then
    ok "no base64 font"
  else
    bad "no base64 font" "$got embedded font data URI(s); only allowed when the user asked"
  fi

  miss=""
  for tok in 'scroll-snap-type: y mandatory' 'scroll-snap-align: start' \
             'scroll-snap-stop: always' 'IntersectionObserver' 'ArrowDown' \
             'ArrowUp' 'prefers-reduced-motion' '@media print'; do
    grep -qF -- "$tok" "$FILE" || miss="$miss '$tok'"
  done
  # A per-slide print break is legitimately spelled either way; accept both.
  grep -qE 'page-break-after|break-after:[[:space:]]*page' "$FILE" ||
    miss="$miss 'page-break-after / break-after: page'"
  if [ -z "$miss" ]; then
    ok "scroll/print/a11y features"
  else
    bad "scroll/print/a11y features" "missing:$miss"
  fi

  flat=$(flatten_tags)
  slides=$(grep 'class="slide[ "]' <<<"$flat" | sed -n 's/.*[[:space:]]id="\([^"]*\)".*/\1/p' || true)
  dots=$(grep 'class="deck-nav__dot"' <<<"$flat" | sed -n 's/.*href="#\([^"]*\)".*/\1/p' || true)
  cues=$(grep 'class="next-cue"' <<<"$flat" | sed -n 's/.*href="#\([^"]*\)".*/\1/p' || true)

  unresolved=""
  while IFS= read -r tok; do
    [ -n "$tok" ] || continue
    grep -qxF -- "$tok" <<<"$slides" || unresolved="$unresolved #$tok"
  done <<<"$dots"
  if [ -z "$unresolved" ]; then
    ok "nav dot hrefs resolve"
  else
    bad "nav dot hrefs resolve" "no slide with id:$unresolved"
  fi

  if [ "$dots" = "$slides" ]; then
    ok "nav dot order"
  else
    bad "nav dot order" "dot hrefs are not the slide ids in document order"
  fi

  # Slide k's cue must point at slide k+1. An off-by-one cue chain is the most
  # common wiring bug in a hand-edited deck, which is why this check exists.
  # Read both lists into arrays once: indexing them beats respawning sed per
  # slide. Plain `read` loops, not mapfile - this must run on macOS bash 3.2.
  cue_ids=(); slide_ids=()
  while IFS= read -r tok; do cue_ids+=("$tok"); done <<<"$cues"
  while IFS= read -r tok; do slide_ids+=("$tok"); done <<<"$slides"
  miss=""
  i=1
  while [ "$i" -lt "$n" ]; do
    got=${cue_ids[i - 1]-}
    want=${slide_ids[i]-}
    if [ "$got" != "$want" ]; then
      miss="slide $i cue points at '#$got', expected '#$want'"
      break
    fi
    i=$((i + 1))
  done
  if [ -z "$miss" ]; then
    ok "next-cue chain"
  else
    bad "next-cue chain" "$miss"
  fi
}

case "$PROFILE" in
  viz) check_viz ;;
  deck) check_deck ;;
esac

TOTAL=$((PASSED + FAILED))
if [ "$FAILED" -eq 0 ]; then
  printf '[OK] verify-html %s: %d/%d passed\n' "$PROFILE" "$PASSED" "$TOTAL"
  exit 0
fi
printf '[FAIL] verify-html %s: %d of %d failed\n' "$PROFILE" "$FAILED" "$TOTAL"
exit 1
