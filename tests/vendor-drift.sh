#!/bin/sh
# Fails when a vendored copy of lib/verify-html.sh drifts from its source.
# The copies exist so a single-skill install (Hermes tap, `npx skills add`)
# still carries the verifier (#41, authoring-skills Check 17). Edit
# lib/verify-html.sh, then re-copy it over every path listed here.
# Discovered by the reusable skill-check workflow's tests/*.sh convention.
set -u
root="$(cd "$(dirname "$0")/.." && pwd)"
src="$root/lib/verify-html.sh"
fails=0
# Listed, not globbed: a deleted copy must fail, not silently shrink the loop.
for copy in skills/visualize/lib/vendor/verify-html.sh \
            skills/md-to-scrolldeck/lib/vendor/verify-html.sh; do
  if cmp -s "$src" "$root/$copy"; then
    printf '[OK] %s matches lib/verify-html.sh\n' "$copy"
  else
    printf '[FAIL] %s differs from lib/verify-html.sh (or is missing) — cp lib/verify-html.sh %s\n' "$copy" "$copy" >&2
    fails=$((fails + 1))
  fi
done
[ "$fails" -eq 0 ]
