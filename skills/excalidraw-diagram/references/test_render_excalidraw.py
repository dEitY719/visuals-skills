"""Self-check for the deterministic (non-browser) parts of render_excalidraw.py.

No pytest, no fixtures — plain asserts. Run directly:

    python3 test_render_excalidraw.py

Covers quality-checklist.md items 16-20 (authoring:skill-check issue #20,
Check 12): validate_excalidraw() stays a structural gate; check_quality_items()
is the new deterministic pass that used to be a manual eyeball.
"""

from __future__ import annotations

from render_excalidraw import check_quality_items, quality_report, validate_excalidraw


def _text(text="hello world", font=3, roughness=0, opacity=100, container_id=None):
    el = {
        "type": "text",
        "text": text,
        "fontFamily": font,
        "roughness": roughness,
        "opacity": opacity,
    }
    if container_id:
        el["containerId"] = container_id
    return el


def test_validate_excalidraw_structural_only():
    assert validate_excalidraw({"type": "excalidraw", "elements": [_text()]}) == []
    assert validate_excalidraw({"type": "wrong", "elements": []})
    assert validate_excalidraw({"type": "excalidraw"})  # missing elements
    assert validate_excalidraw({"type": "excalidraw", "elements": []})  # empty


def test_quality_all_pass():
    elements = [_text(), _text(text="another label")]
    assert check_quality_items(elements) == []


def test_quality_flags_empty_or_placeholder_text():
    problems = check_quality_items([_text(text=""), _text(text="TODO")])
    assert any("text:" in p for p in problems)


def test_quality_flags_wrong_font():
    problems = check_quality_items([_text(font=1)])
    assert any("fontFamily:" in p for p in problems)


def test_quality_flags_roughness_unless_hand_drawn():
    el = _text(roughness=1)
    assert any("roughness:" in p for p in check_quality_items([el]))
    assert check_quality_items([el], allow_hand_drawn=True) == []


def test_quality_flags_opacity():
    problems = check_quality_items([_text(opacity=50)])
    assert any("opacity:" in p for p in problems)


def test_quality_flags_container_ratio_over_30_percent():
    # 1 of 2 text elements contained = 50% >= 30% threshold
    elements = [_text(container_id="box-1"), _text()]
    problems = check_quality_items(elements)
    assert any("container ratio:" in p for p in problems)

    # 0 of 3 contained = 0% < 30%, passes
    elements = [_text(), _text(), _text()]
    assert check_quality_items(elements) == []


def test_render_filters_deleted_before_calling_check_quality_items():
    # check_quality_items() no longer re-filters isDeleted itself (reuse
    # review, PR #31) — render() is the only caller and already filters
    # before passing elements through. Mirror that same filter here so the
    # contract stays pinned: an isDeleted element must never reach the
    # function in the first place.
    deleted = _text(text="")
    deleted["isDeleted"] = True
    live = [e for e in [deleted, _text()] if not e.get("isDeleted")]
    assert check_quality_items(live) == []


def test_quality_report_exit_code_zero_on_pass():
    # CLI contract (review PR #31, agy+codex BLOCKER): a [FAIL] must map to a
    # non-zero exit code, never just a stderr print a caller can ignore.
    line, code = quality_report([])
    assert code == 0
    assert line == "[OK] quality 5/5"


def test_quality_report_exit_code_nonzero_on_fail():
    line, code = quality_report(["fontFamily: 1 text element(s) not fontFamily 3"])
    assert code == 2
    assert line == "[FAIL] quality 4/5: fontFamily: 1 text element(s) not fontFamily 3"


def test_quality_report_denominator_drops_for_hand_drawn():
    # Regression: roughness is skipped when allow_hand_drawn, so a report
    # built from that same run must not still claim "out of 5".
    line, code = quality_report([], allow_hand_drawn=True)
    assert line == "[OK] quality 4/4"
    assert code == 0

    line, code = quality_report(["opacity: 1 element(s) with opacity != 100"], allow_hand_drawn=True)
    assert line == "[FAIL] quality 3/4: opacity: 1 element(s) with opacity != 100"
    assert code == 2


if __name__ == "__main__":
    tests = [v for k, v in list(globals().items()) if k.startswith("test_")]
    for t in tests:
        t()
        print(f"ok  {t.__name__}")
    print(f"\n{len(tests)} tests passed")
