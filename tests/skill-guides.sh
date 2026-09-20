#!/bin/sh
# Drift guard for docs/skill-guides/<skill>.html against skills/<skill>/SKILL.md
# (dEitY719/visuals-skills#29). POSIX sh, like the other tests here, because
# the shared skill-check workflow's "Repo self-checks pass (tests/)" step
# discovers tests/*.sh and this must not depend on how it invokes them.
#
# A guide is its SKILL.md re-rendered by /visuals:visualize. That is an LLM
# call, so the two can never be compared byte for byte - and they cannot be
# compared by date either: in #34 the stale guide's commit was NEWER than the
# SKILL.md it had drifted from, so a timestamp check would have passed the
# exact drift that took a PR to fix. What is left is content.
#
# Every expectation below is READ OUT OF THE SOURCE and only asserted against
# the guide. Nothing here is a literal copied from either file, so editing a
# source moves its expectation with it - that is what keeps this from rotting
# into a list of strings nobody maintains. Each fact is skipped for a skill
# that does not have it, so the checks scope themselves: only `visualize`
# ships a requirements.md, only two SKILL.md files invoke the verifier, and
# only two carry a Related Skills section.
#
# What it cannot do: catch a fact the source DROPPED that the guide still
# shows (#34 also removed "EVALUATION CRITICAL" wording from requirements.md
# while the guide kept rendering it). Asserting absence needs a list of
# retired strings, which is exactly the thing that rots. That half stays a
# reading job.
#
# Run: sh tests/skill-guides.sh
set -eu

cd "$(dirname "$0")/.."

fails=0
checked=0
fail() { printf 'FAIL: %s\n' "$1" >&2; fails=$((fails + 1)); }
pass() { printf '  [ok] %s\n' "$1"; checked=$((checked + 1)); }

# The guide is HTML and a fact routinely wraps across lines inside a tag.
# Unescape the entities a renderer introduces and flatten to one line, so a
# grep for "Print & Accessibility" still finds "Print &amp;\n  Accessibility".
# ponytail: entity and whitespace normalisation only, no tag stripping - a
# fact split by an inline <strong> would need a real parse, and none is today.
guide_text() {
  sed -e 's/&amp;/\&/g' -e 's/&lt;/</g' -e 's/&gt;/>/g' \
      -e 's/&quot;/"/g' -e "s/&#39;/'/g" -e 's/&nbsp;/ /g' "$1" |
    tr '\n' ' ' | tr -s ' '
}

for guide in docs/skill-guides/*.html; do
  skill=$(basename "$guide" .html)
  md="skills/$skill/SKILL.md"
  printf '%s\n' "$skill"

  # 0. The guide's footer names the source it claims to render, and that
  #    source exists. Every check below reads its facts out of that file.
  if [ ! -f "$md" ]; then
    fail "$guide has no source at $md"
    continue
  fi
  text=$(guide_text "$guide")
  case "$text" in
    *"$md"*) pass "footer names $md" ;;
    *) fail "$guide never names its source $md; the footer is its only provenance" ;;
  esac

  # 1. The verifier invocation. SKILL.md owns the profile and the guide must
  #    send the reader to the same one. This is #34's headline drift: the
  #    guide still said "Run references/checklist.md before outputting".
  profile=$(sed -n 's/.*verify-html\.sh" --profile \([a-z][a-z]*\).*/\1/p' "$md" | head -1)
  if [ -n "$profile" ]; then
    case "$text" in
      *"verify-html.sh --profile $profile"*) pass "names verify-html.sh --profile $profile" ;;
      *) fail "$md mandates 'verify-html.sh --profile $profile' but $guide never names it" ;;
    esac
  fi

  # 2. Every numbered requirement. requirements.md is the list the guide's
  #    cards render; item 10 was added to the source and never reached the
  #    guide. Titles only - the guide rewords the bodies on purpose.
  req="skills/$skill/references/requirements.md"
  if [ -f "$req" ]; then
    titles=$(sed -n 's/^[0-9][0-9]*\. \*\*\([^:*]*\).*/\1/p' "$req")
    n=$(printf '%s\n' "$titles" | grep -c . || true)
    if [ "$n" -eq 0 ]; then
      fail "$req has no numbered '**Title:**' items; the extractor found nothing to check"
    else
      # The loop runs in a subshell behind the pipe, so it reports by printing
      # rather than by incrementing a counter the parent would never see.
      missing=$(printf '%s\n' "$titles" | while IFS= read -r t; do
        [ -n "$t" ] || continue
        case "$text" in *"$t"*) ;; *) printf '%s\n' "$t" ;; esac
      done)
      if [ -n "$missing" ]; then
        printf '%s\n' "$missing" | while IFS= read -r t; do
          printf 'FAIL: %s title %s is not in %s\n' "$req" "'$t'" "$guide" >&2
        done
        fails=$((fails + $(printf '%s\n' "$missing" | grep -c .)))
      else
        pass "all $n requirements.md titles present"
      fi
    fi
  fi

  # 3. The sibling boundary. CLAUDE.md calls the Related Skills statement
  #    load-bearing and asks the three to stay in sync; a guide that drops it
  #    stops stating the boundary at all.
  siblings=$(sed -n '/^## Related Skills/,$p' "$md" | grep -o 'visuals:[a-z-]*' | sort -u || true)
  if [ -n "$siblings" ]; then
    bad=0
    for sib in $siblings; do
      case "$text" in
        *"$sib"*) ;;
        *) fail "$md's Related Skills names $sib but $guide does not"; bad=1 ;;
      esac
    done
    if [ "$bad" -eq 0 ]; then
      pass "names every sibling its Related Skills section does"
    fi
  fi
done

# 4. The quality checklist's item count, wherever it is quoted. Three shipped
#    pages said 27 while the file had 23. The count is derived, so it follows
#    the checklist when an item is added.
# ponytail: this repo quotes exactly one checklist by count, so every
#    "<n>-item" claim in tracked text is about that one. A second counted
#    checklist would need this qualified by file or by surrounding text.
checklist='skills/excalidraw-diagram/references/quality-checklist.md'
if [ -f "$checklist" ]; then
  printf 'quality-checklist.md\n'
  want=$(grep -cE '^[0-9]+\. ' "$checklist" || true)
  if [ "$want" -eq 0 ]; then
    fail "$checklist has no numbered items; the count is unusable"
  else
    wrong=$(git grep -nE '[0-9]+-item|verify all [0-9]+ items|[0-9]+/[0-9]+ items' -- '*.md' '*.html' |
      grep -vE "(^|[^0-9])$want-item|verify all $want items|$want/$want items" || true)
    if [ -n "$wrong" ]; then
      fail "$checklist has $want items, but these disagree:"
      printf '%s\n' "$wrong" | sed 's/^/       /' >&2
    else
      pass "every quoted item count is $want"
    fi
  fi
fi

if [ "$fails" -eq 0 ]; then
  printf '[OK] skill-guides: %d derived facts agree with their sources\n' "$checked"
  exit 0
fi
printf '[FAIL] skill-guides: %d check(s) failed\n' "$fails" >&2
exit 1
