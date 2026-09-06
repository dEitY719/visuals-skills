"""Render Excalidraw JSON to PNG using Playwright + headless Chromium.

Usage:
    cd "${CLAUDE_PLUGIN_ROOT}/skills/excalidraw-diagram/references"
    uv run python render_excalidraw.py <path-to-file.excalidraw> [--output path.png] [--scale 2] [--width 1920]

First-time setup:
    cd "${CLAUDE_PLUGIN_ROOT}/skills/excalidraw-diagram/references"
    uv sync
    uv run playwright install chromium
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path


def validate_excalidraw(data: dict) -> list[str]:
    """Validate Excalidraw JSON structure. Returns list of errors (empty = valid)."""
    errors: list[str] = []

    if data.get("type") != "excalidraw":
        errors.append(f"Expected type 'excalidraw', got '{data.get('type')}'")

    if "elements" not in data:
        errors.append("Missing 'elements' array")
    elif not isinstance(data["elements"], list):
        errors.append("'elements' must be an array")
    elif len(data["elements"]) == 0:
        errors.append("'elements' array is empty — nothing to render")

    return errors


_PLACEHOLDER_TEXT = ("lorem ipsum", "placeholder", "todo", "tbd", "xxx")


def check_quality_items(elements: list[dict], allow_hand_drawn: bool = False) -> list[str]:
    """Check quality-checklist.md items 16-20 — deterministic properties of the
    generated JSON (text cleanliness, fontFamily, roughness, opacity, container
    ratio). Returns a list of problem descriptions (empty = all items pass).

    `elements` must already be filtered to exclude `isDeleted` entries — the
    only caller (`render()`) computes that filtered list once and passes it
    straight through; this function does not re-filter it.
    """
    problems: list[str] = []
    live = elements
    text_els = [e for e in live if e.get("type") == "text"]

    # 16. Text clean — no empty or placeholder text
    dirty = [
        e
        for e in text_els
        if not e.get("text", "").strip() or any(p in e.get("text", "").lower() for p in _PLACEHOLDER_TEXT)
    ]
    if dirty:
        problems.append(f"text: {len(dirty)} element(s) empty or placeholder text")

    # 17. Font — fontFamily: 3
    bad_font = [e for e in text_els if e.get("fontFamily") != 3]
    if bad_font:
        problems.append(f"fontFamily: {len(bad_font)} text element(s) not fontFamily 3")

    # 18. Roughness — 0 for clean/modern, unless hand-drawn style was requested
    if not allow_hand_drawn:
        bad_rough = [e for e in live if e.get("roughness", 0) != 0]
        if bad_rough:
            problems.append(f"roughness: {len(bad_rough)} element(s) with roughness != 0")

    # 19. Opacity — 100 for all elements (no transparency)
    bad_opacity = [e for e in live if e.get("opacity", 100) != 100]
    if bad_opacity:
        problems.append(f"opacity: {len(bad_opacity)} element(s) with opacity != 100")

    # 20. Container ratio — <30% of text elements should be inside containers
    if text_els:
        contained = sum(1 for e in text_els if e.get("containerId"))
        ratio = contained / len(text_els)
        if ratio >= 0.3:
            problems.append(f"container ratio: {ratio:.0%} of text elements are inside containers (limit 30%)")

    return problems


def quality_report(problems: list[str], allow_hand_drawn: bool = False) -> tuple[str, int]:
    """Formats the quality-check summary line and the process exit code.

    `total` tracks how many of the 5 checks in check_quality_items() actually
    ran — roughness is skipped when `allow_hand_drawn`, so the denominator
    must drop to 4 in that case rather than always claiming out of 5.
    Returns (line, exit_code): exit_code is 0 when every applicable item
    passed, 2 otherwise (1 is reserved for the pre-render structural
    failures validate_excalidraw() already handles).
    """
    total = 4 if allow_hand_drawn else 5
    passed = total - len(problems)
    if problems:
        return f"[FAIL] quality {passed}/{total}: " + "; ".join(problems), 2
    return f"[OK] quality {total}/{total}", 0


def compute_bounding_box(elements: list[dict]) -> tuple[float, float, float, float]:
    """Compute bounding box (min_x, min_y, max_x, max_y) across all elements."""
    min_x = float("inf")
    min_y = float("inf")
    max_x = float("-inf")
    max_y = float("-inf")

    for el in elements:
        if el.get("isDeleted"):
            continue
        x = el.get("x", 0)
        y = el.get("y", 0)
        w = el.get("width", 0)
        h = el.get("height", 0)

        # For arrows/lines, points array defines the shape relative to x,y
        if el.get("type") in ("arrow", "line") and "points" in el:
            for px, py in el["points"]:
                min_x = min(min_x, x + px)
                min_y = min(min_y, y + py)
                max_x = max(max_x, x + px)
                max_y = max(max_y, y + py)
        else:
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x + abs(w))
            max_y = max(max_y, y + abs(h))

    if min_x == float("inf"):
        return (0, 0, 800, 600)

    return (min_x, min_y, max_x, max_y)


def render(
    excalidraw_path: Path,
    output_path: Path | None = None,
    scale: int = 2,
    max_width: int = 1920,
    hand_drawn: bool = False,
) -> tuple[Path, int]:
    """Render an .excalidraw file to PNG.

    Returns (output_path, quality_exit_code). Rendering always completes and
    output_path is always returned on success — quality_exit_code (0 or 2,
    see quality_report()) is the caller's signal for whether to exit non-zero,
    kept separate so a failed quality gate never withholds the PNG a
    render-view-fix loop needs to see.
    """
    # Import playwright here so validation errors show before import errors
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        here = Path(__file__).resolve().parent
        print("ERROR: playwright not installed.", file=sys.stderr)
        print(
            f"Run: cd {here} && uv sync && uv run playwright install chromium",
            file=sys.stderr,
        )
        sys.exit(1)

    # Read and validate
    raw = excalidraw_path.read_text(encoding="utf-8")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in {excalidraw_path}: {e}", file=sys.stderr)
        sys.exit(1)

    errors = validate_excalidraw(data)
    if errors:
        print("ERROR: Invalid Excalidraw file:", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        sys.exit(1)

    # Compute viewport size from element bounding box
    elements = [e for e in data["elements"] if not e.get("isDeleted")]

    # Deterministic JSON quality checks (items 16-20) run before the expensive
    # Playwright launch below, so the verdict is visible immediately even
    # though rendering still proceeds regardless of the outcome — Step 3
    # (render) is mandatory and independent of Step 4 (quality check) in
    # SKILL.md's Design Process; skipping the render here would deny the
    # render-view-fix loop the PNG it needs to diagnose what to fix.
    quality_problems = check_quality_items(elements, allow_hand_drawn=hand_drawn)
    quality_line, quality_exit_code = quality_report(quality_problems, allow_hand_drawn=hand_drawn)
    print(quality_line, file=sys.stderr if quality_exit_code else sys.stdout)

    min_x, min_y, max_x, max_y = compute_bounding_box(elements)
    padding = 80
    diagram_w = max_x - min_x + padding * 2
    diagram_h = max_y - min_y + padding * 2

    # Cap viewport width, let height be natural
    vp_width = min(int(diagram_w), max_width)
    vp_height = max(int(diagram_h), 600)

    # Output path
    if output_path is None:
        output_path = excalidraw_path.with_suffix(".png")

    # Template path (same directory as this script)
    template_path = Path(__file__).parent / "render_template.html"
    if not template_path.exists():
        print(f"ERROR: Template not found at {template_path}", file=sys.stderr)
        sys.exit(1)

    template_url = template_path.as_uri()

    with sync_playwright() as p:
        try:
            launch_args = []
            if os.environ.get("EXCALIDRAW_IGNORE_CERT_ERRORS"):
                launch_args.append("--ignore-certificate-errors")
            browser = p.chromium.launch(headless=True, args=launch_args or None)
        except Exception as e:
            if "Executable doesn't exist" in str(e) or "browserType.launch" in str(e):
                here = Path(__file__).resolve().parent
                print("ERROR: Chromium not installed for Playwright.", file=sys.stderr)
                print(
                    f"Run: cd {here} && uv run playwright install chromium",
                    file=sys.stderr,
                )
                sys.exit(1)
            raise

        page = browser.new_page(
            viewport={"width": vp_width, "height": vp_height},
            device_scale_factor=scale,
        )

        # Load the template
        page.goto(template_url)

        # Wait for the ES module to load (imports from esm.sh)
        page.wait_for_function("window.__moduleReady === true", timeout=30000)

        # Inject the diagram data and render
        json_str = json.dumps(data)
        result = page.evaluate(f"window.renderDiagram({json_str})")

        if not result or not result.get("success"):
            error_msg = result.get("error", "Unknown render error") if result else "renderDiagram returned null"
            print(f"ERROR: Render failed: {error_msg}", file=sys.stderr)
            browser.close()
            sys.exit(1)

        # Wait for render completion signal
        page.wait_for_function("window.__renderComplete === true", timeout=15000)

        # Screenshot the SVG element
        svg_el = page.query_selector("#root svg")
        if svg_el is None:
            print("ERROR: No SVG element found after render.", file=sys.stderr)
            browser.close()
            sys.exit(1)

        svg_el.screenshot(path=str(output_path))
        browser.close()

    return output_path, quality_exit_code


def main() -> None:
    parser = argparse.ArgumentParser(description="Render Excalidraw JSON to PNG")
    parser.add_argument("input", type=Path, help="Path to .excalidraw JSON file")
    parser.add_argument(
        "--output", "-o", type=Path, default=None, help="Output PNG path (default: same name with .png)"
    )
    parser.add_argument("--scale", "-s", type=int, default=2, help="Device scale factor (default: 2)")
    parser.add_argument("--width", "-w", type=int, default=1920, help="Max viewport width (default: 1920)")
    parser.add_argument(
        "--hand-drawn",
        action="store_true",
        help="Skip the roughness=0 quality check (hand-drawn style was intentionally requested)",
    )
    args = parser.parse_args()

    if not args.input.exists():
        print(f"ERROR: File not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    png_path, quality_exit_code = render(args.input, args.output, args.scale, args.width, args.hand_drawn)
    print(str(png_path))
    if quality_exit_code:
        sys.exit(quality_exit_code)


if __name__ == "__main__":
    main()
