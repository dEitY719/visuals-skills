#!/bin/sh
# Runs the excalidraw-diagram skill's deterministic quality-check self-test
# (validate_excalidraw / check_quality_items, no browser needed). Discovered
# by the reusable skill-check workflow's tests/*.sh convention (dEitY719/
# harness-skills skill-check.yml, "Repo self-checks pass (tests/)").
set -eu
cd "$(dirname "$0")/../skills/excalidraw-diagram/references"
exec python3 test_render_excalidraw.py
